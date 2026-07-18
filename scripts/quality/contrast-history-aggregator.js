#!/usr/bin/env node
/**
 * contrast-history-aggregator.js
 * Parses Playwright contrast test output lines beginning with __CONTRAST_PAYLOAD__
 * and appends a dated snapshot into quality-snapshots/contrast-history.json.
 * Idempotent for a given date+routes combination (merges on same day by route).
 */
import fs from 'fs';
import path from 'path';
import { rollingAverage, slope, stdDev } from './lib/contrastMetrics.js';

const ROOT = process.cwd();
const HISTORY_PATH = path.join(ROOT, 'quality-snapshots', 'contrast-history.json');

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function saveHistory(data) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function parsePayloadLines(input) {
  const lines = input.split(/\r?\n/).filter((l) => l.includes('__CONTRAST_PAYLOAD__'));
  return lines
    .map((l) => {
      const json = l.substring(l.indexOf('__CONTRAST_PAYLOAD__') + '__CONTRAST_PAYLOAD__'.length);
      try {
        return JSON.parse(json);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// Read from stdin
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  const payloads = parsePayloadLines(raw);
  if (!payloads.length) {
    console.error('No contrast payloads detected. Ensure CONTRAST_JSON=1 was set.');
    process.exit(1);
  }
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const history = loadHistory();

  // Find or create today entry
  let todayEntry = history.find((h) => h.date === today);
  if (!todayEntry) {
    todayEntry = { date: today, routes: {}, meta: { createdAt: new Date().toISOString() } };
    history.push(todayEntry);
  }

  for (const p of payloads) {
    todayEntry.routes[p.route] = {
      sampled: p.sampled,
      borderline: p.borderline.length,
      timestamp: new Date().toISOString(),
    };
  }

  // Compute summary stats
  const totals = Object.values(todayEntry.routes).reduce(
    (acc, r) => {
      acc.sampled += r.sampled;
      acc.borderline += r.borderline;
      return acc;
    },
    { sampled: 0, borderline: 0 }
  );
  todayEntry.summary = { ...totals };

  // Derive rolling metrics across previous entries (including today)
  const borderlineSeries = history
    .map((h) => h.summary?.borderline)
    .filter((v) => typeof v === 'number');
  const rolling = rollingAverage(borderlineSeries, 7);
  const trend = slope(borderlineSeries.slice(-7)); // focus on last 7 for localized slope
  const volatility = stdDev(borderlineSeries, 7);
  todayEntry.metrics = {
    rolling7Borderline: rolling,
    slope7Borderline: trend,
    stddev7Borderline: volatility,
  };

  saveHistory(history);
  const alertThreshold = parseInt(process.env.CONTRAST_ALERT_THRESHOLD || '3', 10);
  const slopeThreshold = process.env.CONTRAST_SLOPE_ALERT
    ? parseFloat(process.env.CONTRAST_SLOPE_ALERT)
    : null;
  const slopeVal = todayEntry.metrics.slope7Borderline;
  const countAlert = totals.borderline > alertThreshold;
  const slopeAlert = slopeThreshold != null && slopeVal != null && slopeVal > slopeThreshold;
  console.log(
    `Updated contrast history for ${payloads.length} routes. Total sampled today: ${totals.sampled}. Borderline=${totals.borderline} (threshold=${alertThreshold}). rolling7=${todayEntry.metrics.rolling7Borderline} slope7=${slopeVal} slopeAlertThreshold=${slopeThreshold ?? 'n/a'}`
  );
  if (countAlert) {
    console.log(
      `[contrast-alert] Borderline count ${totals.borderline} exceeds threshold ${alertThreshold}.`
    );
    // Provide last 3-day markdown snippet for issue context
    const recent = history.slice(-3);
    let md =
      '| Date | Borderline | Sampled | Rolling7 | Slope7 | StdDev7 |\n|------|-----------:|--------:|---------:|-------:|---------:|\n';
    for (const e of recent) {
      md += `| ${e.date} | ${e.summary?.borderline ?? 0} | ${e.summary?.sampled ?? 0} | ${e.metrics?.rolling7Borderline ?? '—'} | ${e.metrics?.slope7Borderline ?? '—'} | ${e.metrics?.stddev7Borderline ?? '—'} |\n`;
    }
    console.log(`[contrast-alert-markdown]\n${md}`);
    process.exitCode = 2;
  } else if (slopeAlert) {
    console.log(
      `[contrast-alert] Borderline slope ${slopeVal} exceeds slope threshold ${slopeThreshold}.`
    );
    const recent = history.slice(-3);
    let md =
      '| Date | Borderline | Sampled | Rolling7 | Slope7 | StdDev7 |\n|------|-----------:|--------:|---------:|-------:|---------:|\n';
    for (const e of recent) {
      md += `| ${e.date} | ${e.summary?.borderline ?? 0} | ${e.summary?.sampled ?? 0} | ${e.metrics?.rolling7Borderline ?? '—'} | ${e.metrics?.slope7Borderline ?? '—'} | ${e.metrics?.stddev7Borderline ?? '—'} |\n`;
    }
    console.log(`[contrast-alert-markdown]\n${md}`);
    process.exitCode = 2;
  }
});

process.stdin.resume();
