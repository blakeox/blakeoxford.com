import { expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface RouteBaseline { domContentLoaded: number; fcp: number; load: number; requests: number; }
interface BaselineFile { routes: Record<string, RouteBaseline>; tolerance: { timingPct: number; requestsPct: number }; }
interface HistoryEntry extends RouteBaseline { route: string; ts: string; }

const historyPath = path.resolve(__dirname, 'baselines-history.json');
const MAX_HISTORY = 200; // cap to prevent unbounded growth

const baselinePath = path.resolve(__dirname, 'baselines.json');
let baselines: BaselineFile | null = null;
let dirty = false;

function loadBaselines(): BaselineFile {
  if (!baselines) {
    const raw = fs.readFileSync(baselinePath, 'utf-8');
    baselines = JSON.parse(raw) as BaselineFile;
  }
  return baselines!;
}

export async function capturePerformance(page: Page) {
  await page.waitForLoadState('load');
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      load: nav.loadEventEnd - nav.startTime,
      fcp: (performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry)?.startTime || 0,
      requests: (performance.getEntriesByType('resource') || []).length + 1 // include doc
    };
  });
  return timing;
}

export function compareWithBaseline(route: string, current: { domContentLoaded: number; fcp: number; load: number; requests: number }) {
  const file = loadBaselines();
  const base = file.routes[route];
  if (!base) throw new Error(`No baseline for route ${route}`);
  const { timingPct, requestsPct } = file.tolerance;

  const checks: Array<{ name: string; value: number; base: number; allowed: number }> = [
    { name: 'domContentLoaded', value: current.domContentLoaded, base: base.domContentLoaded, allowed: base.domContentLoaded * (1 + timingPct) },
    { name: 'fcp', value: current.fcp, base: base.fcp, allowed: base.fcp * (1 + timingPct) },
    { name: 'load', value: current.load, base: base.load, allowed: base.load * (1 + timingPct) },
    { name: 'requests', value: current.requests, base: base.requests, allowed: base.requests * (1 + requestsPct) }
  ];

  for (const c of checks) {
    if (c.value <= c.base) {
      // Improvement detected
      if (process.env.UPDATE_PERF_BASELINES === '1') {
        file.routes[route][c.name as keyof RouteBaseline] = c.value;
        dirty = true;
      }
    } else {
      expect.soft(c.value, `${route} ${c.name} regression: ${c.value} > allowed ${c.allowed.toFixed(1)} (baseline ${c.base})`).toBeLessThanOrEqual(c.allowed);
    }
  }
}

export function maybePersistUpdatedBaselines() {
  if (dirty && process.env.UPDATE_PERF_BASELINES === '1' && baselines) {
    fs.writeFileSync(baselinePath, JSON.stringify(baselines, null, 2));
  console.log('[perf] Baselines updated due to improvements');
  }
  if (process.env.PERF_HISTORY === '1' && baselines) {
    const now = new Date().toISOString();
    let history: HistoryEntry[] = [];
    if (fs.existsSync(historyPath)) {
      try { history = JSON.parse(fs.readFileSync(historyPath, 'utf-8')) as HistoryEntry[]; } catch { history = []; }
    }
    for (const [route, metrics] of Object.entries(baselines.routes)) {
      history.push({ route, ts: now, ...metrics });
    }
    if (history.length > MAX_HISTORY) history = history.slice(history.length - MAX_HISTORY);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }
}
