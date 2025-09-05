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
const flakinessHistoryPath = path.join(root, 'flakiness-history.json');
const searchRelevancePath = path.join(root, 'search-relevance-results.json');
const a11yHistoryPath = path.join(root, 'accessibility-history.json');
const longTasksReportPath = path.join(root, 'long-tasks-report.json');
const toxicTestsPath = path.join(root, 'toxic-tests.json');

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
  const routeSlopes = [];
  for (const [route, metrics] of Object.entries(baseline.routes || {})) {
    const routeHistory = history.filter(h => h.route === route).slice(-12); // last 12 runs
    const loadSeries = routeHistory.map(r => r.load);
    const { slope, direction } = calcTrend(loadSeries);
    const pctSlope = loadSeries.length ? (slope / (loadSeries.reduce((a,b)=>a+b,0)/loadSeries.length)) * 100 : 0;
    if (isFinite(pctSlope)) routeSlopes.push(pctSlope);
    let classification = 'stable';
    if (direction === 'regressing') {
      const abs = pctSlope;
      if (abs > 5) classification = 'severe-regression';
      else if (abs > 3) classification = 'moderate-regression';
      else if (abs > 1.5) classification = 'mild-regression';
      else classification = 'noise';
    } else if (direction === 'improving') {
      classification = 'improving';
    }
    const emojiMap = {
      'improving': '✅',
      'noise': '➖',
      'stable': '➖',
      'mild-regression': '⚠️',
      'moderate-regression': '🚨',
      'severe-regression': '🛑'
    };
    const emoji = emojiMap[classification] || '➖';
    const sl = isFinite(pctSlope) ? pctSlope.toFixed(2) + '%' : 'n/a';
    const note = classification !== 'stable' && classification !== 'noise' ? ` (${classification})` : '';
    const seriesSpark = sparkline(loadSeries);
    lines.push(`- ${route}: load=${metrics.load}ms trend=${sl} ${emoji}${note} ${seriesSpark}`);
  }
  return { markdown: lines.join('\n'), routeSlopes };
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

function summarizeFlakiness() {
  if (!fs.existsSync(flakinessHistoryPath)) return null;
  try {
    const hist = loadJSON(flakinessHistoryPath);
    if (!Array.isArray(hist) || !hist.length) return null;
  const sorted = [...hist].sort((a,b)=> (a.lastRun||'').localeCompare(b.lastRun||''));
  const active = sorted.filter(t => !t.quarantine);
  const quarantined = sorted.filter(t => t.quarantine);
  const totalTests = active.length; // exclude quarantined from gating metrics
  const flakyNow = active.filter(t => t.flaky).length;
  const failedNow = active.filter(t => t.failed).length;
  const avgRetriesPerRun = active.reduce((a,t)=> a + (t.totalRetries || 0),0) / (active.reduce((a,t)=> a + (t.runs || 1),0) || 1);
  const intensitySeries = active.map(t => (t.totalRetries || 0)/(t.runs || 1)).sort((a,b)=> b-a).slice(0,12).reverse();
    const { slope, direction } = calcTrend(intensitySeries);
    const pctSlope = intensitySeries.length ? (slope / ((intensitySeries.reduce((a,b)=>a+b,0)/intensitySeries.length)||1)) * 100 : 0;
    let classification = 'stable';
    if (direction === 'regressing') {
      if (pctSlope > 25) classification = 'severe-increase';
      else if (pctSlope > 15) classification = 'moderate-increase';
      else if (pctSlope > 5) classification = 'mild-increase';
      else classification = 'noise';
    } else if (direction === 'improving') {
      classification = 'improving';
    }
    const emojiMap = {
      'improving': '✅',
      'noise': '➖',
      'stable': '➖',
      'mild-increase': '⚠️',
      'moderate-increase': '🚨',
      'severe-increase': '🛑'
    };
    const emoji = emojiMap[classification] || '➖';
    const series = sparkline(intensitySeries);
    const topFlaky = active.filter(t => t.flaky).sort((a,b)=> (b.totalRetries||0)-(a.totalRetries||0)).slice(0,5)
      .map(t => `  - ${t.id} (retries:${t.totalRetries||0}/runs:${t.runs||1})`).join('\n');
    const lines = ['### Flakiness', '', `- Tracked tests (excluding quarantine): ${totalTests}`, `- Currently flaky (last run, excluding quarantine): ${flakyNow}`, `- Currently failed (last run, excluding quarantine): ${failedNow}`, `- Avg retries per test-run (cumulative, excluding quarantine): ${avgRetriesPerRun.toFixed(2)}`, `- Retry intensity trend: ${isFinite(pctSlope)?pctSlope.toFixed(2)+'%':'n/a'} ${emoji} (${classification}) ${series}`];
    if (quarantined.length) {
      const qList = quarantined.slice(0,10).map(t=>`  - ${t.id} (retries:${t.totalRetries||0}, failures:${t.failures||0})`).join('\n');
      lines.push('- Quarantined tests:', qList);
    }
    if (topFlaky) lines.push('- Top flaky tests:', topFlaky);
    lines.push('');
    return { markdown: lines.join('\n'), avgRetriesPerRun };
  } catch { return null; }
}

function computeComposite(perf, mutationScore, flakinessAvgRetries) {
  // Normalize components to 0..100 where higher = better
  // Performance: penalize positive regression slope average (take mean of route slopes if available)
  let perfComponent = 100;
  if (perf && perf.routeSlopes && perf.routeSlopes.length) {
    const avgSlopePct = perf.routeSlopes.reduce((a,b)=>a+b,0)/perf.routeSlopes.length; // positive is regression
    // subtract up to 30 points if severe (>5% avg), linear scale
    const penalty = Math.min(30, Math.max(0, (avgSlopePct/5) * 30));
    perfComponent = 100 - penalty;
  }
  let mutationComponent = 0;
  if (typeof mutationScore === 'number') {
    mutationComponent = Math.min(100, Math.max(0, mutationScore));
  }
  let flakinessComponent = 100;
  if (typeof flakinessAvgRetries === 'number') {
    // Retry intensity 0 -> 100, 0.05 -> 40, >=0.1 -> 0 (linear piecewise)
    const r = flakinessAvgRetries;
    if (r <= 0.05) flakinessComponent = 100 - (r/0.05)*60; else if (r <= 0.1) flakinessComponent = 40 - ((r-0.05)/0.05)*40; else flakinessComponent = 0;
  }
  // Weights: mutation 40%, flakiness 30%, performance 30%
  const composite = (mutationComponent*0.4) + (flakinessComponent*0.3) + (perfComponent*0.3);
  let grade = 'A';
  if (composite < 85) grade = 'B';
  if (composite < 70) grade = 'C';
  if (composite < 55) grade = 'D';
  if (composite < 40) grade = 'E';
  if (composite < 25) grade = 'F';
  return { composite: composite.toFixed(1), grade, parts: { perfComponent: perfComponent.toFixed(1), mutationComponent: mutationComponent.toFixed(1), flakinessComponent: flakinessComponent.toFixed(1) } };
}

function main() {
  const parts = ['# Quality Summary', '', `Generated: ${new Date().toISOString()}`, ''];
  const perfSummary = summarizePerformance();
  if (perfSummary) parts.push(perfSummary.markdown, '');
  const mutationPath = fs.existsSync(mutationReportSummaryPath) ? mutationReportSummaryPath : (fs.existsSync(mutationAltPath) ? mutationAltPath : null);
  let mutationScoreNumeric = null;
  if (mutationPath) {
    try {
      const mr = loadJSON(mutationPath);
      const killed = mr.killed || mr.metrics?.killed || 0;
      const total = mr.totalMutants || mr.metrics?.total || 0;
      const score = mr.mutationScore ?? mr.metrics?.mutationScore ?? (total ? (killed/total*100).toFixed(2) : '0');
      if (!Number.isNaN(parseFloat(score))) mutationScoreNumeric = parseFloat(score);
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
  const flakinessSummary = summarizeFlakiness();
  let avgRetries = null;
  if (flakinessSummary) {
    parts.push(flakinessSummary.markdown);
    avgRetries = flakinessSummary.avgRetriesPerRun;
  }
  // Composite reliability section
  if (perfSummary || mutationScoreNumeric !== null || avgRetries !== null) {
    const composite = computeComposite(
      perfSummary ? { routeSlopes: perfSummary.routeSlopes } : null,
      mutationScoreNumeric,
      avgRetries
    );
    parts.push('### Reliability Composite', '', `- Composite Score: ${composite.composite} (Grade ${composite.grade})`, `- Components => Mutation: ${composite.parts.mutationComponent}, Flakiness: ${composite.parts.flakinessComponent}, Performance: ${composite.parts.perfComponent}`, '');
  }
  // Search relevance
  if (fs.existsSync(searchRelevancePath)) {
    try {
      const sr = loadJSON(searchRelevancePath);
      parts.push('### Search Relevance', '', `- Pass Rate: ${sr.passRate?.toFixed ? sr.passRate.toFixed(1) : sr.passRate}% (${sr.passed}/${sr.total})`, '');
    } catch { /* ignore */ }
  }
  // Accessibility trend
  if (fs.existsSync(a11yHistoryPath)) {
    try {
      const hist = loadJSON(a11yHistoryPath).slice(-12);
      if (hist.length) {
        const perRunTotals = hist.map(r => r.pages.reduce((a,p)=>a+p.violations,0));
        const { slope, direction } = calcTrend(perRunTotals);
        const spark = sparkline(perRunTotals);
        parts.push('### Accessibility Trend', '', `- Recent totals: ${perRunTotals.join(', ')}`, `- Trend slope: ${slope.toFixed(2)} (${direction}) ${spark}`, '');
      }
    } catch { /* ignore */ }
  }
  // Long tasks
  if (fs.existsSync(longTasksReportPath)) {
    try {
      const lt = loadJSON(longTasksReportPath);
      const summaryLine = lt.map(r=>`${r.route} max:${r.max.toFixed ? r.max.toFixed(1):r.max} over50:${r.over50}`).join(' | ');
      parts.push('### Long Task Probe', '', `- Routes: ${summaryLine}`, '');
    } catch { /* ignore */ }
  }
  // Toxic tests
  if (fs.existsSync(toxicTestsPath)) {
    try {
      const tox = loadJSON(toxicTestsPath).slice(0,5);
      if (tox.length) {
        parts.push('### Toxic Tests (Top 5)', '', tox.map(t=>`- ${t.id} score=${t.score.toFixed(3)} retries=${t.avgRetries.toFixed ? t.avgRetries.toFixed(2):t.avgRetries} failRate=${t.failRate} avgDuration=${t.avgDuration}ms`).join('\n'), '');
      }
    } catch { /* ignore */ }
  }
  const output = parts.join('\n');
  fs.writeFileSync(path.join(root, 'quality-summary.md'), output);
  process.stdout.write(output + '\n');
}

main();
