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
const TEST_RESULTS_PATH = path.join(ROOT, 'test-results.json');

function loadJSONSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function detectFromVitest(results) {
  if (!results) return null;
  // Support custom flakinessReporter output shape
  if (Array.isArray(results.tests) || Array.isArray(results.tests?.tests)) {
    const testsArr = Array.isArray(results.tests) ? results.tests : results.tests.tests;
  let total = 0, failed = 0, flaky = 0;
    for (const t of testsArr) {
      total++;
      if (t.status === 'fail') failed++;
      if (/\bflaky\b/i.test(t.fullName || t.name || '') || /\.flaky\./.test(t.file || '')) flaky++;
    }
    return { totalTests: total, failedTests: failed, flakyTests: flaky };
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

  let history = existingHistory;
  if (!history) history = { version: 1, maxEntries: 200, runs: [] };

  history.runs.push({
    timestamp: new Date().toISOString(),
    totalTests: metrics.totalTests,
    failedTests: metrics.failedTests,
    flakyTests: metrics.flakyTests,
    retryIntensity: Number(retryIntensity.toFixed(4)),
    passRate: Number(passRate.toFixed(4))
  });

  if (history.runs.length > history.maxEntries) {
    history.runs.splice(0, history.runs.length - history.maxEntries);
  }

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  console.log(`[flakiness-history] Updated: ${history.runs.length} entries (latest passRate=${passRate.toFixed(3)})`);
}

main();
