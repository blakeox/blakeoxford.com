#!/usr/bin/env node
/**
 * Toxic Test Detector
 * Ranks tests by (normalized retries + failures + duration weight).
 * Robust to history file being array-shaped or object-shaped ({ runs: [] }).
 */
import fs from 'fs';

const file = 'flakiness-history.json';
if (!fs.existsSync(file)) {
  console.log('[toxic] no flakiness-history.json');
  process.exit(0);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
} catch {
  console.warn('[toxic] failed to parse flakiness-history.json; skipping');
  process.exit(0);
}

const history = Array.isArray(raw) ? raw : raw && Array.isArray(raw.runs) ? raw.runs : [];
if (!Array.isArray(history) || history.length === 0) {
  console.log('[toxic] empty flakiness history');
  fs.writeFileSync('toxic-tests.json', JSON.stringify([], null, 2));
  process.exit(0);
}

function score(t) {
  const runs = t.runs || 1;
  const retryRate = (t.totalRetries || 0) / runs; // avg retries per run
  const failRate = (t.failures || 0) / runs;
  const avgDuration = (t.totalDuration || 0) / runs; // ms
  // weights: retries 0.4, failRate 0.4, duration scaled 0.2 (>=3000ms saturates)
  const durationScore = Math.min(1, avgDuration / 3000);
  return retryRate * 0.4 + failRate * 0.4 + durationScore * 0.2;
}

const ranked = history
  .filter((t) => (t?.runs || 0) > 0 && typeof t.id === 'string')
  .map((t) => ({
    id: t.id,
    score: score(t),
    runs: t.runs,
    avgRetries: (t.totalRetries || 0) / (t.runs || 1),
    avgDuration: ((t.totalDuration || 0) / (t.runs || 1)).toFixed(1),
    failRate: ((t.failures || 0) / (t.runs || 1)).toFixed(2),
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);

fs.writeFileSync('toxic-tests.json', JSON.stringify(ranked, null, 2));
console.log('[toxic] top offenders');
ranked.forEach((r) =>
  console.log(
    `  - ${r.id} score=${r.score.toFixed(3)} retries=${r.avgRetries.toFixed(2)} failRate=${r.failRate} avgDuration=${r.avgDuration}ms`
  )
);
