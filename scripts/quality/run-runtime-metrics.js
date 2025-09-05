#!/usr/bin/env node
/**
 * Orchestrates build -> preview server -> runtime metric scripts -> teardown.
 * Designed for CI reproducibility.
 */
import { spawn } from 'child_process';
import fs from 'fs';

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('exit', (code) => code === 0 ? resolve() : reject(new Error(cmd + ' exited ' + code)));
  });
}

(async () => {
  try {
    console.log('[runtime] building site');
    await run('pnpm', ['build']);
    console.log('[runtime] starting preview server');
    const server = spawn('pnpm', ['preview'], { stdio: 'pipe' });
    let ready = false;
    server.stdout.on('data', d => { if (!ready && d.toString().includes('Local')) { ready = true; } });
    // Wait until server appears ready (max 10s)
    const start = Date.now();
    while (!ready && Date.now() - start < 10000) {
      await new Promise(r=> setTimeout(r,200));
    }
    if (!ready) throw new Error('Preview server not ready');
    process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
    console.log('[runtime] running search relevance');
    if (fs.existsSync('scripts/quality/search-relevance-golden.js')) await run('node', ['scripts/quality/search-relevance-golden.js']);
    console.log('[runtime] running a11y trend');
    if (fs.existsSync('scripts/quality/a11y-trend-log.js')) await run('node', ['scripts/quality/a11y-trend-log.js']);
    console.log('[runtime] running long task probe');
    if (fs.existsSync('scripts/quality/perf-long-tasks.js')) await run('node', ['scripts/quality/perf-long-tasks.js']);
    console.log('[runtime] generating toxic test list (if history)');
    if (fs.existsSync('flakiness-history.json')) await run('node', ['scripts/quality/toxic-test-detector.js']);
    console.log('[runtime] generating quality summary');
    await run('pnpm', ['quality:summary']);
    console.log('[runtime] snapshot');
    await run('pnpm', ['quality:snapshot']).catch(()=>{});
    server.kill('SIGTERM');
    console.log('[runtime] complete');
  } catch (e) {
    console.error('[runtime] failed', e.message);
    process.exitCode = 1;
  }
})();
