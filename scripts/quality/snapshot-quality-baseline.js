#!/usr/bin/env node
/**
 * Snapshot current quality summary & key metrics into timestamped archive.
 *
 * Creates: quality-snapshots/<ISO_DATE>/
 *  - quality-summary.md (copied if exists)
 *  - flakiness-history.json (if exists)
 *  - performance-history.json (if exists)
 * Appends an index line to quality-snapshots/INDEX.md with terse metrics.
 */

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const now = new Date();
const stamp =
  now.toISOString().split('T')[0] +
  '_' +
  now
    .toISOString()
    .split('T')[1]
    .replace(/[:.].*/, '');
const dateDir = path.join(root, 'quality-snapshots', stamp);
fs.mkdirSync(dateDir, { recursive: true });

const files = ['quality-summary.md', 'flakiness-history.json', 'performance-history.json'];

function safeRead(f) {
  try {
    return fs.readFileSync(path.join(root, f), 'utf8');
  } catch {
    return null;
  }
}

files.forEach((f) => {
  const data = safeRead(f);
  if (data) {
    fs.writeFileSync(path.join(dateDir, f), data, 'utf8');
  }
});

let avgRetryIntensity = 'n/a';
let flakyCount = 'n/a';

try {
  const fhRaw = safeRead('flakiness-history.json');
  if (fhRaw) {
    const fh = JSON.parse(fhRaw);
    let totalRetries = 0,
      totalRuns = 0,
      flaky = 0;
    fh.forEach((r) => {
      totalRetries += r.totalRetries || 0;
      totalRuns += r.runs || 0;
      if (r.flaky) flaky++;
    });
    if (totalRuns > 0) avgRetryIntensity = (totalRetries / totalRuns).toFixed(3);
    flakyCount = String(flaky);
  }
} catch {
  /* ignore parse errors */
}

const indexPath = path.join(root, 'quality-snapshots', 'INDEX.md');
let indexIntro = '';
if (!fs.existsSync(indexPath)) {
  indexIntro =
    '# Quality Snapshots Index\n\n| Snapshot | Avg Retry Intensity | Δ Retry | Flaky Tests |\n|----------|---------------------|--------|-------------|\n';
}

let prevRetry = null;
if (fs.existsSync(indexPath)) {
  try {
    const content = fs.readFileSync(indexPath, 'utf8').trim().split('\n');
    for (let i = content.length - 1; i >= 0; i--) {
      const row = content[i];
      if (/^\| \d{4}-\d{2}-\d{2}_/.test(row)) {
        const cols = row.split('|').map((c) => c.trim());
        // Prefer new layout (Snapshot | Retry | Δ Retry | Flaky); fall back to old mutation layout.
        if (cols.length >= 5 && cols[2] && cols[2] !== 'n/a' && !Number.isNaN(parseFloat(cols[2]))) {
          prevRetry = parseFloat(cols[2]);
        } else if (cols[4] && cols[4] !== 'n/a') {
          prevRetry = parseFloat(cols[4]);
        }
        break;
      }
    }
  } catch {
    /* ignore */
  }
}

let deltaRetry = 'n/a';
if (
  prevRetry !== null &&
  avgRetryIntensity !== 'n/a' &&
  !Number.isNaN(parseFloat(avgRetryIntensity))
) {
  deltaRetry = (parseFloat(avgRetryIntensity) - prevRetry).toFixed(3);
  if (!deltaRetry.startsWith('-')) deltaRetry = '+' + deltaRetry;
}

const line = `| ${stamp} | ${avgRetryIntensity} | ${deltaRetry} | ${flakyCount} |\n`;
fs.appendFileSync(indexPath, indexIntro + line, 'utf8');

console.log(`[quality:snapshot] Archived snapshot at ${dateDir}`);
