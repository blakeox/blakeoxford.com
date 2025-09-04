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

function summarizePerformance() {
  if (!fs.existsSync(perfBaselinePath)) return null;
  const baseline = loadJSON(perfBaselinePath);
  let history = [];
  if (fs.existsSync(perfHistoryPath)) {
    try { history = loadJSON(perfHistoryPath); } catch { history = []; }
  }
  const lines = ['### Performance Baselines'];
  for (const [route, metrics] of Object.entries(baseline.routes || {})) {
    const routeHistory = history.filter(h => h.route === route).slice(-10);
    const first = routeHistory[0];
    const last = routeHistory[routeHistory.length -1];
    const change = (first && last) ? (((last.load - first.load) / first.load) * 100).toFixed(1) + '%' : 'n/a';
    lines.push(`- ${route}: load=${metrics.load}ms (10-run change: ${change})`);
  }
  return lines.join('\n');
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
