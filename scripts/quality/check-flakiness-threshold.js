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

let hist; try { hist = JSON.parse(fs.readFileSync(historyFile,'utf-8')); } catch { fail('Unable to parse flakiness-history.json'); }
if (!Array.isArray(hist) || !hist.length) {
  info('Empty history; skipping');
  process.exit(0);
}

// Current snapshot metrics (use latest lastRun value per test — entries already consolidated per test).
const currentFlaky = hist.filter(t => t.flaky).length;
const totalRetries = hist.reduce((a,t)=> a + (t.totalRetries||0),0);
const totalRuns = hist.reduce((a,t)=> a + (t.runs||1),0) || 1;
const avgRetryIntensity = totalRetries / totalRuns;

const maxFlaky = process.env.FLAKINESS_MAX_CURRENT_FLAKY ? parseInt(process.env.FLAKINESS_MAX_CURRENT_FLAKY,10) : null;
const maxIntensity = process.env.FLAKINESS_MAX_RETRY_INTENSITY ? parseFloat(process.env.FLAKINESS_MAX_RETRY_INTENSITY) : null;

let violated = false;
if (maxFlaky !== null && currentFlaky > maxFlaky) {
  violated = true; fail(`Currently flaky tests (${currentFlaky}) exceed limit (${maxFlaky})`);
}
if (maxIntensity !== null && avgRetryIntensity > maxIntensity) {
  violated = true; fail(`Avg retry intensity (${avgRetryIntensity.toFixed(2)}) exceeds limit (${maxIntensity})`);
}
if (!violated) info(`PASS (flaky:${currentFlaky}${maxFlaky!==null?`<=${maxFlaky}`:''}, intensity:${avgRetryIntensity.toFixed(2)}${maxIntensity!==null?`<=${maxIntensity}`:''})`);
process.exit(0);
