#!/usr/bin/env node
/**
 * Orchestrates build -> static server -> runtime metric scripts -> teardown.
 * Dynamic port + graceful shutdown + health retries.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import { pathToFileURL } from 'node:url';

const pnpmCommand = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';
const pnpmArgs = ['pnpm'];

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(cmd + ' exited ' + code))));
  });
}

async function waitForOk(url, timeoutMs = 10000) {
  const start = Date.now();
  const { request } = url.startsWith('https') ? await import('https') : await import('http');
  function probe() {
    return new Promise((res) => {
      const req = request(url, { method: 'GET' }, (r) => {
        r.destroy();
        res(r.statusCode && r.statusCode < 500);
      });
      req.on('error', () => res(false));
      req.setTimeout(2000, () => {
        req.destroy();
        res(false);
      });
      req.end();
    });
  }
  while (Date.now() - start < timeoutMs) {
    if (await probe()) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

export async function stopRuntimePreview(child, platform = process.platform) {
  if (!child?.pid) return;
  const hasExited = () => child.exitCode !== null || child.signalCode !== null;
  if (platform === 'win32' && hasExited()) return;
  try {
    if (platform === 'win32') {
      await run('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
  } catch (error) {
    if (error.code === 'ESRCH') return;
    if (platform === 'win32') {
      if (hasExited()) return;
      // taskkill has no ESRCH code; check whether the owned process disappeared.
      try {
        process.kill(child.pid, 0);
      } catch (probeError) {
        if (probeError.code === 'ESRCH') return;
      }
    }
    throw error;
  }
}

export function registerPreviewSignalHandlers(child) {
  let stopping = false;
  const handlers = new Map();
  const remove = () => {
    for (const [signal, handler] of handlers) process.off(signal, handler);
  };
  for (const [signal, code] of [
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ]) {
    const handler = async () => {
      if (stopping) return;
      stopping = true;
      try {
        await stopRuntimePreview(child);
      } catch (error) {
        console.error('[runtime] interrupted preview teardown failed:', error.message);
      }
      remove();
      process.exit(code);
    };
    handlers.set(signal, handler);
    process.once(signal, handler);
  }
  return remove;
}

async function main() {
  let serverProc;
  let removeSignalHandlers = () => {};
  try {
    console.log('[runtime] build');
    await run(pnpmCommand, [...pnpmArgs, 'build']);

    // Find free port starting at 5000
    let port = 5000;
    const isFree = (p) =>
      new Promise((res) => {
        const srv = http.createServer().listen(p, () => srv.close(() => res(true))); // if success then free
        srv.on('error', () => res(false));
      });
    while (!(await isFree(port)) && port < 6000) port++;
    if (port >= 6000) throw new Error('No free port found 5000-5999');

    process.env.BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${port}`;
    console.log('[runtime] preview on', process.env.BASE_URL);
    serverProc = spawn(
      pnpmCommand,
      [...pnpmArgs, 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', String(port)],
      { stdio: 'inherit', detached: process.platform !== 'win32' }
    );
    removeSignalHandlers = registerPreviewSignalHandlers(serverProc);
    serverProc.on('error', (error) => {
      console.error('[runtime] preview failed:', error.message);
      process.exitCode = 1;
    });

    const healthy = await waitForOk(`${process.env.BASE_URL}/`);
    if (!healthy) throw new Error('Server health check failed');

    const step = async (label, fn) => {
      console.log(`[runtime] ${label}`);
      try {
        await fn();
        return true;
      } catch (e) {
        console.error(`[runtime] ${label} failed:`, e.message);
        return false;
      }
    };

    const searchOk = await step('search relevance', async () => {
      if (fs.existsSync('scripts/quality/search-relevance-golden.js'))
        await run('node', ['scripts/quality/search-relevance-golden.js']);
    });
    // Evaluate gate if results exist
    let relevanceGatePassed = true;
    const minTopNEnv = parseFloat(process.env.MIN_TOPN_PASS_RATE || '0');
    if (fs.existsSync('search-relevance-results.json')) {
      try {
        const data = JSON.parse(fs.readFileSync('search-relevance-results.json', 'utf-8'));
        if (data.minTopNRequired > 0 && !data.gatePassed) {
          relevanceGatePassed = false;
          console.warn('[runtime] search relevance gate failed');
        }
      } catch (e) {
        console.warn('[runtime] unable to parse search relevance results', e.message);
      }
    } else if (minTopNEnv > 0 && searchOk === false) {
      // Missing results and the step failed while a gate is required => treat as failure
      relevanceGatePassed = false;
    }
    const a11yOk = await step('a11y trend', async () => {
      if (fs.existsSync('scripts/quality/a11y-trend-log.js'))
        await run('node', ['scripts/quality/a11y-trend-log.js']);
    });
    const deadOk = await step('dead links', async () => {
      if (fs.existsSync('scripts/quality/check-dead-links.js'))
        await run('node', ['scripts/quality/check-dead-links.js']);
    });
    await step('long tasks', async () => {
      if (fs.existsSync('scripts/quality/perf-long-tasks.js'))
        await run('node', ['scripts/quality/perf-long-tasks.js']);
    });
    await step('toxic test list', async () => {
      if (fs.existsSync('flakiness-history.json'))
        await run('node', ['scripts/quality/toxic-test-detector.js']);
    });
    await step('quality summary', async () => {
      await run(pnpmCommand, [...pnpmArgs, 'quality:summary']);
    });
    await step('snapshot', async () => {
      await run(pnpmCommand, [...pnpmArgs, 'quality:snapshot']).catch(() => {});
    });

    console.log('[runtime] complete');
    // If any gate failed (search/a11y/dead-links), mark overall failure
    if (!relevanceGatePassed || a11yOk === false || deadOk === false) process.exitCode = 1;
  } catch (e) {
    console.error('[runtime] failed', e.message);
    process.exitCode = 1;
  } finally {
    removeSignalHandlers();
    try {
      await stopRuntimePreview(serverProc);
    } catch (error) {
      console.error('[runtime] preview teardown failed:', error.message);
      process.exitCode = 1;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
