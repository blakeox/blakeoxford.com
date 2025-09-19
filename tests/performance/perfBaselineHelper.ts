import { expect, Page } from '@playwright/test';
import fs from 'fs';
import { resolveFrom } from '../utils/esmPath.js';

interface RouteBaseline { domContentLoaded: number; fcp: number; load: number; requests: number; }
interface BaselineFile { routes: Record<string, RouteBaseline>; tolerance: { timingPct: number; requestsPct: number }; }
interface HistoryEntry extends RouteBaseline { route: string; ts: string; }

const historyPath = resolveFrom(import.meta, 'baselines-history.json');
const MAX_HISTORY = 200; // cap to prevent unbounded growth

const baselinePath = resolveFrom(import.meta, 'baselines.json');
let baselines: BaselineFile | null = null;
let dirty = false;

// Conservative baseline ratcheting to avoid over-tightening from a single lucky run
// - Only update when improvement exceeds this threshold (2%)
const IMPROVEMENT_MIN_PCT = 0.02;
// - Cap baseline drop per update to 5% to reduce flakiness on the next run
const RATCHET_MAX_DROP_PCT = 0.05;

function loadBaselines(): BaselineFile {
  if (!baselines) {
    const raw = fs.readFileSync(baselinePath, 'utf-8');
    baselines = JSON.parse(raw) as BaselineFile;
  }
  return baselines!;
}

export async function capturePerformance(page: Page): Promise<{ domContentLoaded: number; fcp: number; load: number; requests: number; browser?: 'chromium' | 'firefox' | 'webkit' | 'unknown' }> {
  await page.waitForLoadState('load');
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadEventEnd = nav.loadEventEnd;
    const domContentLoadedEnd = nav.domContentLoadedEventEnd;
    // Only count resource requests that started on or before loadEventEnd to avoid
    // including post-load prefetches or lazy activity that adds variance.
    const origin = location.origin;
    const allowedInitiators = new Set(['img', 'script', 'css', 'xmlhttprequest', 'fetch', 'font', 'navigation']);
    const resourcesBeforeLoad = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter(r => r.startTime <= loadEventEnd)
      // Exclude cross-origin (e.g., analytics) which are not part of core content
      .filter(r => r.name.startsWith(origin))
      // Exclude preloads/prefetches initiated via <link>
      .filter(r => allowedInitiators.has((r as any).initiatorType))
      // For fetch/xhr, exclude ones kicked off after DOMContentLoaded (likely prefetch)
      .filter(r => {
        const it = (r as any).initiatorType as string | undefined;
        if (!it) return true;
        if (it === 'fetch' || it === 'xmlhttprequest') {
          return r.startTime <= domContentLoadedEnd;
        }
        return true;
      });
    // Basic browser detection from UA for baseline partitioning
    const ua = navigator.userAgent || '';
    const browser = (
      /Firefox\//.test(ua)
        ? 'firefox'
        : (/AppleWebKit\//.test(ua) && /Safari\//.test(ua) && !/Chrome\//.test(ua)
            ? 'webkit'
            : (/Chrome\//.test(ua) || /Edg\//.test(ua) ? 'chromium' : 'unknown'))
    ) as 'chromium' | 'firefox' | 'webkit' | 'unknown';
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      load: nav.loadEventEnd - nav.startTime,
      fcp: (performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry)?.startTime || 0,
      requests: resourcesBeforeLoad.length + 1, // include the main document
      browser
    };
  });
  return timing;
}

export function compareWithBaseline(route: string, current: { domContentLoaded: number; fcp: number; load: number; requests: number; browser?: 'chromium' | 'firefox' | 'webkit' | 'unknown' }) {
  const file = loadBaselines();
  const browser = current.browser || 'unknown';
  const browserKey = `${route}__${browser}`;
  // Prefer browser-specific baseline, fall back to generic to preserve current behavior.
  let base = (file.routes as any)[browserKey] || file.routes[route];
  // If updating baselines is enabled and a browser-specific key does not exist yet,
  // initialize it from the generic baseline so future improvements persist per-browser.
  if (process.env.UPDATE_PERF_BASELINES === '1') {
    const hasBrowserKey = Boolean((file.routes as any)[browserKey]);
    if (!hasBrowserKey && file.routes[route]) {
      (file.routes as any)[browserKey] = { ...(file.routes as any)[route] } as RouteBaseline;
      base = (file.routes as any)[browserKey];
      dirty = true;
    }
  }
  // Safety valve: if an existing browser-specific baseline is unrealistically low compared to
  // the generic route baseline and the current run is far above its allowed window, reseed
  // the browser-specific baseline from the current run (only when updates are enabled).
  const genericBase = file.routes[route];
  if (
    process.env.UPDATE_PERF_BASELINES === '1' &&
    genericBase &&
    (file.routes as any)[browserKey] &&
    base &&
    base.load < genericBase.load * 0.2 &&
    current.load > base.load * (1 + file.tolerance.timingPct * 2)
  ) {
    (file.routes as any)[browserKey] = {
      domContentLoaded: current.domContentLoaded,
      fcp: current.fcp,
      load: current.load,
      requests: current.requests
    } as RouteBaseline;
    base = (file.routes as any)[browserKey];
    dirty = true;
    console.log(`[perf] Reseeded suspect baseline for ${browserKey} from current run`);
  }
  if (!base) throw new Error(`No baseline for route ${route}`);
  const { timingPct, requestsPct } = file.tolerance;

  const checks: Array<{ name: keyof RouteBaseline; value: number; base: number; allowed: number }> = [
    { name: 'domContentLoaded', value: current.domContentLoaded, base: base.domContentLoaded, allowed: base.domContentLoaded * (1 + timingPct) },
    { name: 'fcp', value: current.fcp, base: base.fcp, allowed: base.fcp * (1 + timingPct) },
    { name: 'load', value: current.load, base: base.load, allowed: base.load * (1 + timingPct) },
    { name: 'requests', value: current.requests, base: base.requests, allowed: base.requests * (1 + requestsPct) }
  ];

  for (const c of checks) {
    if (c.value <= c.base) {
      // Improvement detected — only persist meaningful improvements, and ratchet conservatively.
      if (process.env.UPDATE_PERF_BASELINES === '1') {
        const improvementPct = (c.base - c.value) / c.base;
        if (improvementPct >= IMPROVEMENT_MIN_PCT) {
          const key = (file.routes as any)[browserKey] ? browserKey : route;
          const currentBase = (file.routes as any)[key][c.name] as number;
          // Cap the drop to at most RATCHET_MAX_DROP_PCT to avoid over-tight baseline
          const minAllowed = currentBase * (1 - RATCHET_MAX_DROP_PCT);
          let newValue = Math.max(c.value, minAllowed);
          if (c.name === 'requests') newValue = Math.round(newValue);
          (file.routes as any)[key][c.name] = newValue as any;
          dirty = true;
        }
      }
    } else {
      expect.soft(c.value, `${route} ${c.name} regression: ${c.value} > allowed ${c.allowed.toFixed(1)} (baseline ${c.base})`).toBeLessThanOrEqual(c.allowed);
    }
  }
}

export function maybePersistUpdatedBaselines() {
  if (dirty && process.env.UPDATE_PERF_BASELINES === '1' && baselines) {
    // Normalize: ensure 'requests' are integers across the file
    for (const [, v] of Object.entries(baselines.routes)) {
      if (v && typeof (v as any).requests === 'number') {
        (v as any).requests = Math.round((v as any).requests);
      }
    }
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
