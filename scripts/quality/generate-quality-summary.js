#!/usr/bin/env node
/**
 * Aggregates recent quality artifacts into a single markdown summary.
 * - API diff reports (if any)
 * - Latest performance baseline vs history delta (if history enabled)
 * Output: quality-summary.md (stdout + file) for easy PR attachment.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());
const apiDiffDir = path.join(root, 'tests/contracts/baselines/diff-reports');
const perfBaselinePath = path.join(root, 'tests/performance/baselines.json');
const perfHistoryPath = path.join(root, 'tests/performance/baselines-history.json');
const mutationHistoryPath = path.join(root, 'mutation-history.json');
const mutationReportSummaryPath = path.join(root, 'mutation-report', 'report.json'); // primary Stryker json
const mutationAltPath = path.join(root, 'reports', 'mutation', 'report.json'); // fallback
const mutationBaselineFile = path.join(root, '.mutation-baseline.json');

function loadJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')); }

function collectApiDiffs() {
  if (!fs.existsSync(apiDiffDir)) return [];
  return fs.readdirSync(apiDiffDir)
    .filter(f => f.endsWith('-diff.md'))
    .map(f => ({ name: f, content: fs.readFileSync(path.join(apiDiffDir, f), 'utf-8') }));
}

function sparkline(values) {
  if (!values.length) return '';
  const blocks = ['▁','▂','▃','▄','▅','▆','▇','█'];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map(v => blocks[Math.min(blocks.length - 1, Math.floor(((v - min) / range) * (blocks.length - 1)))]).join('');
}

function calcTrend(values) {
  if (values.length < 3) return { slope: 0, direction: 'flat' };
  // simple linear regression slope (x = index, y = value)
  const n = values.length;
  const sumX = (n - 1) * n / 2; // 0..n-1
  const sumY = values.reduce((a,b)=>a+b,0);
  const sumXY = values.reduce((acc,v,i)=> acc + i * v, 0);
  const sumX2 = (n - 1) * n * (2*n -1) / 6;
  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = (n * sumX2) - (sumX * sumX) || 1;
  const slope = numerator / denominator;
  const direction = Math.abs(slope) < 0.01 ? 'flat' : (slope > 0 ? 'regressing' : 'improving');
  return { slope, direction };
}

function summarizePerformance() {
  if (!fs.existsSync(perfBaselinePath)) return null;
  const baseline = loadJSON(perfBaselinePath);
  let history = [];
  if (fs.existsSync(perfHistoryPath)) {
    try { history = loadJSON(perfHistoryPath); } catch { history = []; }
  }
  const lines = ['### Performance Baselines'];
  for (const [route, metrics] of Object.entries(baseline.routes || {})) {
    const routeHistory = history.filter(h => h.route === route).slice(-12); // last 12 runs
    const loadSeries = routeHistory.map(r => r.load);
    const { slope, direction } = calcTrend(loadSeries);
    const pctSlope = loadSeries.length ? (slope / (loadSeries.reduce((a,b)=>a+b,0)/loadSeries.length)) * 100 : 0;
    const emoji = direction === 'improving' ? '✅' : direction === 'regressing' ? '⚠️' : '➖';
    const sl = isFinite(pctSlope) ? pctSlope.toFixed(2) + '%' : 'n/a';
    const seriesSpark = sparkline(loadSeries);
    lines.push(`- ${route}: load=${metrics.load}ms trend=${sl} ${emoji} ${seriesSpark}`);
  }
  return lines.join('\n');
}

function summarizeMutationHistory() {
  if (!fs.existsSync(mutationHistoryPath)) return null;
  try {
    const hist = loadJSON(mutationHistoryPath).slice(-12);
    const scores = hist.map(h => h.score);
    if (!scores.length) return null;
    const { slope, direction } = calcTrend(scores);
    const series = sparkline(scores);
    const emoji = direction === 'improving' ? '✅' : direction === 'regressing' ? '⚠️' : '➖';
    return ['### Mutation Trend', '', `- Recent (last ${scores.length}): ${scores.map(s=>s.toFixed(1)).join(', ')}`, `- Trend slope ~ ${slope.toFixed(3)} (${direction}) ${emoji} ${series}`, ''].join('\n');
  } catch { return null; }
}

function main() {
  const parts = ['# Quality Summary', '', `Generated: ${new Date().toISOString()}`, ''];
  const perf = summarizePerformance();
  if (perf) parts.push(perf, '');
  const mutationPath = fs.existsSync(mutationReportSummaryPath) ? mutationReportSummaryPath : (fs.existsSync(mutationAltPath) ? mutationAltPath : null);
  if (mutationPath) {
    try {
      const mr = loadJSON(mutationPath);
      const killed = mr.killed || mr.metrics?.killed || 0;
      const total = mr.totalMutants || mr.metrics?.total || 0;
      const score = mr.mutationScore ?? mr.metrics?.mutationScore ?? (total ? (killed/total*100).toFixed(2) : '0');
      let section = ['### Mutation Testing', '', `- Mutation Score: ${score}% (${killed}/${total} killed)`];
      if (fs.existsSync(mutationBaselineFile)) {
        try {
          const b = JSON.parse(fs.readFileSync(mutationBaselineFile, 'utf-8')).baseline;
          const delta = (parseFloat(score) - b).toFixed(2);
            section.push(`- Baseline: ${b}% (Δ ${delta}%)`);
        } catch { /* ignore */ }
      }
      const min = process.env.MUTATION_MIN_SCORE ? parseFloat(process.env.MUTATION_MIN_SCORE) : null;
      if (min !== null && !Number.isNaN(min)) {
        const status = parseFloat(score) >= min ? '✅ Meets' : '⚠️ Below';
        section.push(`- Threshold (${min}%): ${status}`);
      }
      section.push('');
  parts.push(...section);
  const mutTrend = summarizeMutationHistory();
  if (mutTrend) parts.push(mutTrend);
    } catch {
      parts.push('### Mutation Testing', '', '_Mutation report unreadable_', '');
    }
  }
  const diffs = collectApiDiffs();
  if (diffs.length) {
    parts.push('### API Diff Reports', '');
    for (const d of diffs) {
      parts.push(`#### ${d.name}`, '', d.content, '');
    }
  }
  if (!diffs.length) parts.push('### API Diff Reports', '', '_No API baseline changes detected._', '');
  const output = parts.join('\n');
  fs.writeFileSync(path.join(root, 'quality-summary.md'), output);
  process.stdout.write(output + '\n');
}

main();
