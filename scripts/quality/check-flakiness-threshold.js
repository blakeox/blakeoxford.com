#!/usr/bin/env node
/**
 * Checks aggregated flakiness metrics against configurable thresholds.
 * Non-zero exit if thresholds exceeded (used in quality gate / CI).
 *
 * Environment Variables:
 *  FLAKINESS_MAX_CURRENT_FLAKY   - maximum allowable currently flaky tests (absolute count)
 *  FLAKINESS_MAX_RETRY_INTENSITY - maximum allowable average retries per test-run (cumulative) (float)
 *  FLAKINESS_STRICT              - if set (any value), fail on missing history instead of noop
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());
const historyFile = path.join(root, 'flakiness-history.json');

function fail(msg) { console.error(`❌ Flakiness Gate: ${msg}`); process.exit(1); }
function info(msg) { console.log(`ℹ️  Flakiness Gate: ${msg}`); }

if (!fs.existsSync(historyFile)) {
  if (process.env.FLAKINESS_STRICT) fail('History file missing');
  info('No history file; skipping (non-strict mode)');
  process.exit(0);
}

let parsed; try { parsed = JSON.parse(fs.readFileSync(historyFile,'utf-8')); } catch { fail('Unable to parse flakiness-history.json'); }

let currentFlaky = 0;
let avgRetryIntensity = 0;

// Backward compatibility: legacy format was an array of per-test objects
if (Array.isArray(parsed)) {
  if (!parsed.length) { info('Empty history (legacy array); skipping'); process.exit(0); }
  currentFlaky = parsed.filter(t => t.flaky).length;
  const totalRetries = parsed.reduce((a,t)=> a + (t.totalRetries||0),0);
  const totalRuns = parsed.reduce((a,t)=> a + (t.runs||1),0) || 1;
  avgRetryIntensity = totalRetries / totalRuns;
} else if (parsed && Array.isArray(parsed.runs)) {
  // New run-level aggregate format { version, runs: [ { flakyTests, retryIntensity, ... } ] }
  if (!parsed.runs.length) { info('Empty history (run-level); skipping'); process.exit(0); }
  const latest = parsed.runs[parsed.runs.length - 1];
  currentFlaky = latest.flakyTests ?? 0;
  // Prefer explicit retryIntensity if present; else derive from flaky / total
  if (typeof latest.retryIntensity === 'number') {
    avgRetryIntensity = latest.retryIntensity;
  } else if (latest.totalTests) {
    avgRetryIntensity = latest.flakyTests / latest.totalTests;
  } else {
    avgRetryIntensity = 0;
  }
} else {
  info('Unrecognized flakiness history shape; skipping');
  process.exit(0);
}

const maxFlaky = process.env.FLAKINESS_MAX_CURRENT_FLAKY ? parseInt(process.env.FLAKINESS_MAX_CURRENT_FLAKY,10) : null;
const maxIntensity = process.env.FLAKINESS_MAX_RETRY_INTENSITY ? parseFloat(process.env.FLAKINESS_MAX_RETRY_INTENSITY) : null;

let violated = false;
if (maxFlaky !== null && currentFlaky > maxFlaky) {
  violated = true; fail(`Currently flaky tests (${currentFlaky}) exceed limit (${maxFlaky})`);
}
if (maxIntensity !== null && avgRetryIntensity > maxIntensity) {
  violated = true; fail(`Avg retry intensity (${avgRetryIntensity.toFixed(4)}) exceeds limit (${maxIntensity})`);
}
if (!violated) info(`PASS (flaky:${currentFlaky}${maxFlaky!==null?`<=${maxFlaky}`:''}, intensity:${avgRetryIntensity.toFixed(4)}${maxIntensity!==null?`<=${maxIntensity}`:''})`);
process.exit(0);
