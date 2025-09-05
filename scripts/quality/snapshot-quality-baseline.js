#!/usr/bin/env node
/**
 * Snapshot current quality summary & key metrics into timestamped archive.
 *
 * Creates: quality-snapshots/<ISO_DATE>/
 *  - quality-summary.md (copied if exists)
 *  - flakiness-history.json (if exists)
 *  - mutation-history.json / mutation-baseline.json (if exist)
 *  - performance-history.json (if exists)
 * Appends an index line to quality-snapshots/INDEX.md with terse metrics.
 */

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const now = new Date();
const stamp = now.toISOString().split('T')[0] + '_' + now.toISOString().split('T')[1].replace(/[:.].*/, '');
const dateDir = path.join(root, 'quality-snapshots', stamp);
fs.mkdirSync(dateDir, { recursive: true });

const files = [
  'quality-summary.md',
  'flakiness-history.json',
  'mutation-history.json',
  'mutation-baseline.json',
  'performance-history.json'
];

function safeRead(f) {
  try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return null; }
}

// Copy existing files
files.forEach(f => {
  const data = safeRead(f);
  if (data) {
    fs.writeFileSync(path.join(dateDir, f), data, 'utf8');
  }
});

// Derive terse metrics, best-effort
let mutationScore = 'n/a';
let avgRetryIntensity = 'n/a';
let flakyCount = 'n/a';

try {
  const qs = safeRead('quality-summary.md');
  if (qs) {
    const mutMatch = qs.match(/Mutation Score[^0-9]*([0-9]+(?:\.[0-9]+)?)/i);
    if (mutMatch) mutationScore = mutMatch[1];
  }
} catch { /* ignore parse errors */ }

try {
  const fhRaw = safeRead('flakiness-history.json');
  if (fhRaw) {
    const fh = JSON.parse(fhRaw);
    let totalRetries = 0, totalRuns = 0, flaky = 0;
    fh.forEach(r => { totalRetries += r.totalRetries || 0; totalRuns += r.runs || 0; if (r.flaky) flaky++; });
    if (totalRuns > 0) avgRetryIntensity = (totalRetries / totalRuns).toFixed(3);
    flakyCount = String(flaky);
  }
} catch { /* ignore parse errors */ }

const indexPath = path.join(root, 'quality-snapshots', 'INDEX.md');
let indexIntro = '';
if (!fs.existsSync(indexPath)) {
  indexIntro = '# Quality Snapshots Index\n\n| Snapshot | Mutation Score | Δ Mutation | Avg Retry Intensity | Δ Retry | Flaky Tests |\n|----------|----------------|-----------|---------------------|--------|-------------|\n';
}

// Read previous line for deltas (last non-header line)
let prevMutation = null, prevRetry = null;
if (fs.existsSync(indexPath)) {
  try {
    const content = fs.readFileSync(indexPath, 'utf8').trim().split('\n');
    // find last data row (starts with | 20...) ignoring header separators
    for (let i = content.length - 1; i >= 0; i--) {
      const row = content[i];
      if (/^\| \d{4}-\d{2}-\d{2}_/.test(row)) { // data row
        const cols = row.split('|').map(c => c.trim());
        // Columns per new header: 0 empty,1 Snapshot,2 Mutation Score,3 Δ Mutation,4 Avg Retry Intensity,5 Δ Retry,6 Flaky Tests,7 empty
        if (cols[2] && cols[2] !== 'n/a') prevMutation = parseFloat(cols[2]);
        if (cols[4] && cols[4] !== 'n/a') prevRetry = parseFloat(cols[4]);
        break;
      }
    }
  } catch { /* ignore */ }
}

let deltaMutation = 'n/a';
let deltaRetry = 'n/a';
if (prevMutation !== null && mutationScore !== 'n/a' && !Number.isNaN(parseFloat(mutationScore))) {
  deltaMutation = (parseFloat(mutationScore) - prevMutation).toFixed(2);
  if (!deltaMutation.startsWith('-')) deltaMutation = '+' + deltaMutation;
}
if (prevRetry !== null && avgRetryIntensity !== 'n/a' && !Number.isNaN(parseFloat(avgRetryIntensity))) {
  deltaRetry = (parseFloat(avgRetryIntensity) - prevRetry).toFixed(3);
  if (!deltaRetry.startsWith('-')) deltaRetry = '+' + deltaRetry;
}

const line = `| ${stamp} | ${mutationScore} | ${deltaMutation} | ${avgRetryIntensity} | ${deltaRetry} | ${flakyCount} |\n`;
fs.appendFileSync(indexPath, indexIntro + line, 'utf8');

console.log(`[quality:snapshot] Archived snapshot at ${dateDir}`);
