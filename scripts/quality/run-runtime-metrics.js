#!/usr/bin/env node
/**
 * Orchestrates build -> static server -> runtime metric scripts -> teardown.
 * Dynamic port + graceful shutdown + health retries.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('exit', (code) => code === 0 ? resolve() : reject(new Error(cmd + ' exited ' + code)));
  });
}

async function waitForOk(url, timeoutMs = 10000) {
  const start = Date.now();
  const { request } = url.startsWith('https') ? await import('https') : await import('http');
  function probe() {
    return new Promise(res => {
      const req = request(url, { method: 'GET' }, r => { r.destroy(); res(r.statusCode && r.statusCode < 500); });
      req.on('error', () => res(false));
      req.setTimeout(2000, () => { req.destroy(); res(false); });
      req.end();
    });
  }
  while (Date.now() - start < timeoutMs) {
    if (await probe()) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
}

(async () => {
  let serverProc;
  try {
    console.log('[runtime] build');
    await run('pnpm', ['build']);

    // Find free port starting at 5000
    let port = 5000;
    const isFree = p => new Promise(res => {
      const srv = http.createServer().listen(p, () => srv.close(() => res(true))); // if success then free
      srv.on('error', () => res(false));
    });
    while (!(await isFree(port)) && port < 6000) port++;
    if (port >= 6000) throw new Error('No free port found 5000-5999');

    process.env.BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;
    console.log('[runtime] serve dist on', process.env.BASE_URL);
    serverProc = spawn('npx', ['serve', 'dist', '-l', String(port)], { stdio: 'inherit' });

    const healthy = await waitForOk(`${process.env.BASE_URL}/`);
    if (!healthy) throw new Error('Server health check failed');

    const step = async (label, fn) => {
      console.log(`[runtime] ${label}`);
      try { await fn(); } catch (e) { console.error(`[runtime] ${label} failed:`, e.message); }
    };

    await step('search relevance', async () => {
      if (fs.existsSync('scripts/quality/search-relevance-golden.js')) await run('node', ['scripts/quality/search-relevance-golden.js']);
    });
    // Evaluate gate if results exist
    let relevanceGatePassed = true;
    if (fs.existsSync('search-relevance-results.json')) {
      try {
        const data = JSON.parse(fs.readFileSync('search-relevance-results.json','utf-8'));
        if (data.minTopNRequired > 0 && !data.gatePassed) {
          relevanceGatePassed = false;
          console.warn('[runtime] search relevance gate failed');
        }
      } catch (e) {
        console.warn('[runtime] unable to parse search relevance results', e.message);
      }
    }
    await step('a11y trend', async () => {
      if (fs.existsSync('scripts/quality/a11y-trend-log.js')) await run('node', ['scripts/quality/a11y-trend-log.js']);
    });
    await step('dead links', async () => {
      if (fs.existsSync('scripts/quality/check-dead-links.js')) await run('node', ['scripts/quality/check-dead-links.js']);
    });
    await step('long tasks', async () => {
      if (fs.existsSync('scripts/quality/perf-long-tasks.js')) await run('node', ['scripts/quality/perf-long-tasks.js']);
    });
    await step('toxic test list', async () => {
      if (fs.existsSync('flakiness-history.json')) await run('node', ['scripts/quality/toxic-test-detector.js']);
    });
    await step('quality summary', async () => { await run('pnpm', ['quality:summary']); });
    await step('snapshot', async () => { await run('pnpm', ['quality:snapshot']).catch(()=>{}); });

    console.log('[runtime] complete');
    if (!relevanceGatePassed) process.exitCode = 1;
  } catch (e) {
    console.error('[runtime] failed', e.message);
    process.exitCode = 1;
  } finally {
    if (serverProc && !serverProc.killed) serverProc.kill('SIGTERM');
  }
})();
