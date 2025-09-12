#!/usr/bin/env node
/**
 * Reads quality-snapshots/contrast-history.json (latest entry) and if
 * borderline > threshold, prints a GitHub Actions issue body payload line
 * beginning with CONTRAST_ISSUE::. Non-failing if none.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HISTORY_PATH = path.join(ROOT, 'quality-snapshots', 'contrast-history.json');
const threshold = parseInt(process.env.CONTRAST_ALERT_THRESHOLD || '3', 10);

if (!fs.existsSync(HISTORY_PATH)) {
  console.error('contrast-alert-check: history file missing');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
if (!Array.isArray(data) || !data.length) process.exit(0);
const latest = data[data.length - 1];
const borderline = latest.summary?.borderline || 0;
if (borderline > threshold) {
  const routes = Object.entries(latest.routes)
    .filter(([, r]) => r.borderline > 0)
    .map(([route, r]) => `${route}(${r.borderline})`).join(', ');
  const body = `Contrast borderline threshold exceeded: ${borderline} > ${threshold}. Affected routes: ${routes}`;
  console.log(`CONTRAST_ISSUE::${body}`);
  process.exit(0);
} else {
  console.log(`contrast-alert-check: OK borderline=${borderline} threshold=${threshold}`);
}
