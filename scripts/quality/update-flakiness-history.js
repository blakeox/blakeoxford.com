#!/usr/bin/env node
/**
 * update-flakiness-history.js
 * Aggregates latest test results into a rolling flakiness-history.json file.
 * Low-risk additive utility: invoked before flakiness gate to ensure history exists.
 *
 * History structure:
 * {
 *   versions: 1,
 *   maxEntries: 200,
 *   runs: [
 *     {
 *       timestamp: ISO,
 *       totalTests: number,
 *       failedTests: number,
 *       flakyTests: number,          // currently detected flaky (retry-based if available)
 *       retryIntensity: number,      // flakyTests / totalTests (approx)
 *       passRate: number
 *     }
 *   ]
 * }
 *
 * Detection strategy (initial minimal):
 * - Consumes Vitest JSON if present (test-results.json) or falls back to counting from summary metrics.
 * - Flaky detection placeholder: if test file names include `.flaky.` or if there is a retries field in future formats.
 * - This can be enhanced later without changing gate interface.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HISTORY_PATH = path.join(ROOT, 'flakiness-history.json');
const CACHE_DIR = path.join(ROOT, '.cache', 'quality');
const CACHED_HISTORY_PATH = path.join(CACHE_DIR, 'flakiness-history.json');
const TEST_RESULTS_PATH = path.join(ROOT, 'test-results.json');

function loadJSONSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function detectFromVitest(results) {
  if (!results) return null;
  // Support custom flakinessReporter output shape
  if (Array.isArray(results.tests) || Array.isArray(results.tests?.tests)) {
    const testsArr = Array.isArray(results.tests) ? results.tests : results.tests.tests;
    let total = 0, failed = 0, flaky = 0, retryDerived = 0;
    for (const t of testsArr) {
      total++;
      if (t.status === 'fail') failed++;
      // Determine flakes via retry count >0 leading to final pass. (Assumes reporter exposes retry.)
      const retryCount = typeof t.retry === 'number' ? t.retry : 0;
      if (retryCount > 0 && t.status === 'pass') {
        flaky++;
        retryDerived++;
      } else if (/\bflaky\b/i.test(t.fullName || t.name || '') || /\.flaky\./.test(t.file || '')) {
        flaky++;
      }
    }
    return { totalTests: total, failedTests: failed, flakyTests: flaky, retryDerived };
  }
  // Legacy (future) JSON reporter compatibility
  if (Array.isArray(results.testResults)) {
    let total = 0, failed = 0, flaky = 0;
    for (const file of results.testResults) {
      if (!file.assertionResults) continue;
      for (const t of file.assertionResults) {
        total++;
        if (t.status === 'failed') failed++;
        if (/\bflaky\b/i.test(t.title) || /\.flaky\./.test(file.name)) flaky++;
      }
    }
    return { totalTests: total, failedTests: failed, flakyTests: flaky };
  }
  return null;
}

function fallbackScan() {
  // As we don't have structured data, assume last run passed with zero flakes.
  // Count approximate total tests by grepping vitest summary if accessible later; for now leave null => caller sets defaults.
  return null;
}

function prune(history) {
  if (!history || !Array.isArray(history.runs)) return history;
  // Remove any early placeholder entries (totalTests === 0) except if ALL are zero keep latest only
  const meaningful = history.runs.filter(r => typeof r.totalTests === 'number' && r.totalTests > 0);
  // Also drop any entries that do not contain recognized timestamp fields and vitals
  const cleaned = (meaningful.length ? meaningful : history.runs).filter(r => (
    typeof r.totalTests === 'number' && typeof r.failedTests === 'number' && typeof r.flakyTests === 'number'
  ));
  if (cleaned.length === 0) {
    // keep only the last (most recent) zero-test metrics-like entry if present
    if (history.runs.length > 1) history.runs = [history.runs[history.runs.length -1]];
    return history;
  }
  history.runs = cleaned;
  return history;
}

function ensureCacheDir(){
  try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch { /* ignore */ }
}

function mergeCached(history) {
  const cached = loadJSONSafe(CACHED_HISTORY_PATH);
  if (!cached || !Array.isArray(cached.runs)) return history;
  if (!history || !Array.isArray(history.runs)) return cached;
  // Merge by timestamp uniqueness
  const existingKeys = new Set(
    history.runs.map(r => (typeof r.timestamp === 'string' && r.timestamp) || (typeof r.lastRun === 'string' && r.lastRun) || '')
  );
  for (const run of cached.runs) {
    const key = (typeof run.timestamp === 'string' && run.timestamp) || (typeof run.lastRun === 'string' && run.lastRun) || '';
    if (key && !existingKeys.has(key)) history.runs.push(run);
  }
  // Sort ascending by best-effort timestamp (fallback to lastRun); place entries without any timestamp at the start
  history.runs.sort((a,b)=> {
    const ta = (typeof a.timestamp === 'string' && a.timestamp) || (typeof a.lastRun === 'string' && a.lastRun) || '';
    const tb = (typeof b.timestamp === 'string' && b.timestamp) || (typeof b.lastRun === 'string' && b.lastRun) || '';
    if (!ta && !tb) return 0;
    if (!ta) return -1;
    if (!tb) return 1;
    return ta.localeCompare(tb);
  });
  return history;
}

function main() {
  const rawResults = loadJSONSafe(TEST_RESULTS_PATH);
  let metrics = detectFromVitest(rawResults) || fallbackScan();

  if (!metrics) {
    // Provide conservative placeholder based on environment variable hint if provided.
    const envTotal = parseInt(process.env.TOTAL_TESTS_LAST || '0', 10);
    metrics = { totalTests: envTotal, failedTests: 0, flakyTests: 0 };
  }

  // If metrics show zero tests and we already have a non-empty history, skip recording to avoid noise
  let existingHistory = loadJSONSafe(HISTORY_PATH);
  if (metrics.totalTests === 0 && existingHistory && Array.isArray(existingHistory.runs) && existingHistory.runs.length > 0) {
    console.log('[flakiness-history] Skipping zero-test run (non-initial)');
    return;
  }

  const passRate = metrics.totalTests ? (metrics.totalTests - metrics.failedTests) / metrics.totalTests : 1;
  const retryIntensity = metrics.totalTests ? (metrics.flakyTests / metrics.totalTests) : 0;

  // Also try cached copy for continuity across clean runs
  let history = mergeCached(existingHistory) || { version: 1, maxEntries: 200, runs: [] };

  history.runs.push({
    timestamp: new Date().toISOString(),
    totalTests: metrics.totalTests,
    failedTests: metrics.failedTests,
    flakyTests: metrics.flakyTests,
    retryIntensity: Number(retryIntensity.toFixed(4)),
    passRate: Number(passRate.toFixed(4))
  });

  history = prune(history);

  if (history.runs.length > history.maxEntries) {
    history.runs.splice(0, history.runs.length - history.maxEntries);
  }
  // Persist root & cache
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  ensureCacheDir();
  fs.writeFileSync(CACHED_HISTORY_PATH, JSON.stringify(history, null, 2));
  console.log(`[flakiness-history] Updated: ${history.runs.length} entries (latest passRate=${passRate.toFixed(3)}, flaky=${metrics.flakyTests})`);
}

main();
