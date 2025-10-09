import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Detect upward drift over recent history before tolerance breach.
// Non-blocking unless PERF_TREND_STRICT=1.

interface HistoryEntry { route: string; ts: string; domContentLoaded: number; fcp: number; load: number; requests: number }

function loadHistory(): HistoryEntry[] | null {
  const p = path.resolve(__dirname, 'baselines-history.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as HistoryEntry[]; } catch { return null; }
}

function groupBy<T, K extends string | number>(arr: T[], key: (t: T) => K): Record<K, T[]> {
  return arr.reduce((acc, cur) => { const k = key(cur); (acc[k] ||= []).push(cur); return acc; }, {} as Record<K, T[]>);
}

describe('Performance Trend (Drift Detection)', () => {
  const history = loadHistory();
  if (!history || history.length < 20) {
    it.skip('insufficient history for trend analysis', () => {});
    return;
  }
  const grouped = groupBy(history.slice(-120), h => h.route); // check last up to 120 entries

  for (const [route, samples] of Object.entries(grouped)) {
    if (samples.length < 8) continue; // need enough points
    it(`route ${route} shows no upward drift`, () => {
      // Simple linear regression on load metric
      const ys = samples.map(s => s.load);
      const xs = samples.map((_, i) => i);
      const n = xs.length;
      const sumX = xs.reduce((a,b)=>a+b,0);
      const sumY = ys.reduce((a,b)=>a+b,0);
      const sumXY = xs.reduce((a,b,i)=>a + b * ys[i],0);
      const sumX2 = xs.reduce((a,b)=>a + b*b,0);
      const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX + 1e-9);
      const pctChange = (ys[ys.length-1] - ys[0]) / ys[0];
      const driftFlag = slope > 0 && pctChange > 0.08; // >8% increase over window
      if (driftFlag && process.env.PERF_TREND_STRICT === '1') {
        expect.fail(`Upward performance drift detected for ${route}: slope=${slope.toFixed(2)}, change=${(pctChange*100).toFixed(1)}%`);
      } else if (driftFlag) {
        console.warn(`[perf-trend] Warning: drift for ${route}: slope=${slope.toFixed(2)}, change=${(pctChange*100).toFixed(1)}%`);
      }
    });
  }
});
