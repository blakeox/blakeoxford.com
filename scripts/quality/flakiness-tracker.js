#!/usr/bin/env node
/**
 * Lightweight flakiness tracker.
 * Appends or updates entries in flakiness-history.json recording retry counts and failures.
 * Intended to be called after a Playwright run where results JSON is available.
 * Non-blocking: never throws hard.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());
const historyFile = path.join(root, 'flakiness-history.json');
const pwReport =
  process.env.PW_JSON_REPORT || path.join(root, 'playwright-report', 'test-results.json');

function loadJSONSafe(p, fallback) {
  try {
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function normalizeTestId(titlePathArr) {
  return titlePathArr.join(' > ');
}

function main() {
  const historyData = loadJSONSafe(historyFile, { version: 1, maxEntries: 200, runs: [] });
  const history = Array.isArray(historyData) ? historyData : historyData.runs || [];

  // If we loaded an object structure, we'll need to save it back that way
  const isObjectStructure = !Array.isArray(historyData);

  const index = new Map(history.map((h, i) => [h.id, i]));
  const report = loadJSONSafe(pwReport, null);
  if (!report || !report.suites) {
    console.warn('[flakiness] No Playwright JSON report found, skipping');
    return;
  }
  const now = new Date().toISOString();
  const updates = [];
  function walkSuite(suite) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const id = normalizeTestId(test.titlePath || []);
        const retries = test.results?.length ? test.results.length - 1 : 0; // initial + retries
        const duration = test.results?.reduce((a, r) => a + (r.duration || 0), 0) || 0; // ms aggregate
        const failed = test.results?.some((r) => r.status === 'failed') || false;
        const flaky = retries > 0 && !failed;
        const quarantine =
          (test.title || '').includes('@quarantine') ||
          (spec.title || '').includes('@quarantine') ||
          id.includes('@quarantine');
        const entry = { id, lastRun: now, retries, failed, flaky, quarantine, duration };
        if (index.has(id)) {
          const i = index.get(id);
          const existing = history[i];
          history[i] = {
            ...existing,
            ...entry,
            runs: (existing.runs || 0) + 1,
            totalRetries: (existing.totalRetries || 0) + retries,
            failures: (existing.failures || 0) + (failed ? 1 : 0),
            totalDuration: (existing.totalDuration || 0) + duration,
          };
        } else {
          history.push({
            ...entry,
            runs: 1,
            totalRetries: retries,
            failures: failed ? 1 : 0,
            totalDuration: duration,
          });
        }
        updates.push(entry);
      }
    }
    for (const child of suite.suites || []) walkSuite(child);
  }
  for (const s of report.suites) walkSuite(s);
  // Cap history length (just safety)
  if (history.length > 5000) history.splice(0, history.length - 5000);

  // Save in the appropriate format
  if (isObjectStructure) {
    const updatedData = { ...historyData, runs: history };
    saveJSON(historyFile, updatedData);
  } else {
    saveJSON(historyFile, history);
  }

  console.log(`[flakiness] Updated ${updates.length} tests. Total tracked: ${history.length}`);
}

main();
