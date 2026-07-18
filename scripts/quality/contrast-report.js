#!/usr/bin/env node
/**
 * Summarize recent contrast history entries with rolling & slope metrics.
 * Usage: node scripts/quality/contrast-report.js [--limit 5] [--json] [--markdown]
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const getArg = (flag, d) => {
  const i = args.indexOf(flag);
  if (i === -1) return d;
  const val = args[i + 1];
  if (!val || val.startsWith('--')) return d;
  return val;
};
const limit = parseInt(getArg('--limit', '7'), 10);
const asJson = args.includes('--json');
const asMarkdown = args.includes('--markdown');

const ROOT = process.cwd();
const HISTORY_PATH = path.join(ROOT, 'quality-snapshots', 'contrast-history.json');
if (!fs.existsSync(HISTORY_PATH)) {
  console.error('No contrast-history.json found. Run contrast test with CONTRAST_JSON=1 first.');
  process.exit(1);
}
const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
if (!Array.isArray(history) || !history.length) {
  console.error('Contrast history empty.');
  process.exit(1);
}
// Take last N entries
const recent = history.slice(-limit);

function format(num) {
  if (num === null || num === undefined) return '—';
  return typeof num === 'number' ? num.toFixed(2) : String(num);
}

if (asJson) {
  const payload = recent.map((e) => ({
    date: e.date,
    borderline: e.summary?.borderline ?? 0,
    sampled: e.summary?.sampled ?? 0,
    rolling7: e.metrics?.rolling7Borderline ?? null,
    slope7: e.metrics?.slope7Borderline ?? null,
    stddev7: e.metrics?.stddev7Borderline ?? null,
  }));
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

if (asMarkdown) {
  let md =
    '| Date | Borderline | Sampled | Rolling7 | Slope7 | StdDev7 |\n|------|-----------:|--------:|---------:|-------:|---------:|\n';
  for (const e of recent) {
    md += `| ${e.date} | ${e.summary?.borderline ?? 0} | ${e.summary?.sampled ?? 0} | ${format(e.metrics?.rolling7Borderline)} | ${format(e.metrics?.slope7Borderline)} | ${format(e.metrics?.stddev7Borderline)} |\n`;
  }
  const latest = recent[recent.length - 1];
  md += `\nLatest: borderline=${latest.summary.borderline} sampled=${latest.summary.sampled} rolling7=${format(latest.metrics?.rolling7Borderline)} slope7=${format(latest.metrics?.slope7Borderline)} stddev7=${format(latest.metrics?.stddev7Borderline)}`;
  console.log(md);
  process.exit(0);
}

// Render table
const rows = [['Date', 'Borderline', 'Sampled', 'Rolling7', 'Slope7', 'StdDev7']];
for (const e of recent) {
  rows.push([
    e.date,
    String(e.summary?.borderline ?? 0),
    String(e.summary?.sampled ?? 0),
    format(e.metrics?.rolling7Borderline),
    format(e.metrics?.slope7Borderline),
    format(e.metrics?.stddev7Borderline),
  ]);
}
// column widths
const widths = rows[0].map((_, col) => Math.max(...rows.map((r) => r[col].length)));
const line = (r) => r.map((c, i) => c.padEnd(widths[i], ' ')).join('  ');
console.log(line(rows[0]));
console.log(widths.map((w) => '-'.repeat(w)).join('  '));
for (const r of rows.slice(1)) console.log(line(r));

const latest = recent[recent.length - 1];
console.log(
  '\nLatest: borderline=' +
    latest.summary.borderline +
    ' sampled=' +
    latest.summary.sampled +
    ' rolling7=' +
    format(latest.metrics?.rolling7Borderline) +
    ' slope7=' +
    format(latest.metrics?.slope7Borderline) +
    ' stddev7=' +
    format(latest.metrics?.stddev7Borderline)
);
