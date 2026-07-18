#!/usr/bin/env node
/**
 * report-flaky-tests.js
 * Reads test-results.json (custom reporter output) and flakiness-history.json to:
 *  - List tests that succeeded only after retries (retry>0 & status pass)
 *  - List tests that failed (potential new unstable candidates)
 *  - Optionally persist per-test flake frequency history in .cache/quality/flaky-tests-history.json
 *
 * Environment Flags:
 *  FLAKY_HISTORY=1  -> enable persistence of per-test flake counts
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const RESULTS = path.join(ROOT, 'test-results.json');
const CACHE_DIR = path.join(ROOT, '.cache', 'quality');
const HISTORY_FILE = path.join(CACHE_DIR, 'flaky-tests-history.json');

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}
function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {
    /* ignore */
  }
}

const results = readJSON(RESULTS);
if (!results || !Array.isArray(results.tests)) {
  console.log('[flaky-report] No structured test-results.json; nothing to report');
  process.exit(0);
}

const flaky = [];
const failing = [];
for (const t of results.tests) {
  const retry = typeof t.retry === 'number' ? t.retry : 0;
  if (retry > 0 && t.status === 'pass') flaky.push(t);
  if (t.status === 'fail') failing.push(t);
}

console.log('\n=== Flaky Test Report ===');
if (flaky.length === 0) console.log('No flaky (retry-assisted) tests this run ✅');
else {
  flaky.sort((a, b) => (b.retry || 0) - (a.retry || 0));
  for (const f of flaky) {
    console.log(`FLAKY x${f.retry}: ${f.fullName || f.name} (${f.file})`);
  }
}
if (failing.length) {
  console.log('\nFailed Tests (candidates for instability):');
  for (const f of failing) console.log(`FAIL: ${f.fullName || f.name} (${f.file})`);
}

if (process.env.FLAKY_HISTORY) {
  ensureDir(CACHE_DIR);
  const hist = readJSON(HISTORY_FILE) || { version: 1, tests: {} };
  const now = Date.now();
  for (const f of flaky) {
    const key = `${f.file}::${f.fullName || f.name}`;
    if (!hist.tests[key])
      hist.tests[key] = {
        file: f.file,
        name: f.fullName || f.name,
        flakes: 0,
        lastFlaked: null,
        firstDetected: now,
      };
    hist.tests[key].flakes += 1;
    hist.tests[key].lastFlaked = now;
  }
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(hist, null, 2));
  console.log(
    `\n[flaky-report] Persisted per-test flake history (${Object.keys(hist.tests).length} tracked)`
  );
}
