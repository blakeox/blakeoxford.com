#!/usr/bin/env node
/**
 * Dead Links Checker
 * Crawls built HTML in dist/ to extract internal links and assets, then requests them against BASE_URL.
 * Emits dead-links-report.json. Gate with DEADLINK_FAIL=true to fail on any 404.
 */
import fs from 'fs';
import path from 'path';
import http from 'node:http';
import https from 'node:https';
import { collectHtmlFiles, buildLinkTasks, runPool, buildAllowlist } from '../../src/utils/links/deadLinkCore.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const base = process.env.BASE_URL || 'http://localhost:4321';
const fail = process.env.DEADLINK_FAIL === 'true';
const includeExternal = process.env.DEADLINK_EXTERNAL === 'true';
const allowlistPattern = process.env.DEADLINK_ALLOWLIST || '';
const maxConcurrency = parseInt(process.env.DEADLINK_MAX_CONCURRENCY || '10', 10);
const reportPath = path.join(root, 'dead-links-report.json');
const allowlisted = buildAllowlist(allowlistPattern);

function classify(status){
  if (status === 0) return 'error';
  if (status >= 200 && status < 300) return 'ok';
  if (status === 404) return 'missing';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client';
  if (status >= 500) return 'server';
  return 'other';
}

(async () => {
  if (!fs.existsSync(distDir)) {
    console.warn('[deadlinks] dist not found, skipping');
    process.exit(0);
  }
  const htmlFiles = collectHtmlFiles(distDir);
  const tasks = buildLinkTasks(htmlFiles, distDir, { includeExternal });
  const results = await runPool(tasks, Math.max(1, maxConcurrency), async (t) => {
    const isInternal = !t.isExternal;
    const full = t.isExternal ? t.urlPath : base.replace(/\/$/, '') + t.urlPath;
    if (allowlisted(full) || allowlisted(t.urlPath)) {
      return { url: t.urlPath, full, status: 200, skipped: 'allowlist' };
    }
    const status = await getStatus(full);
    return { url: t.urlPath, full, status, isExternal: t.isExternal, isInternal, classification: classify(status) };
  });
  const dead = results.filter(r => !r.skipped && (r.status === 404 || r.status === 0));
  const payload = {
    total: results.length,
    dead: dead.length,
    includeExternal,
    maxConcurrency,
    allowlist: allowlistPattern,
    items: results.filter(r => !r.skipped && (r.status === 404 || r.status === 0))
  };
  fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
  console.log(`[deadlinks] checked=${results.length} dead=${dead.length} external=${includeExternal}`);
  if (fail && dead.length > 0) process.exitCode = 1;
})();

function request(method, url){
  const mod = url.startsWith('https:') ? https : http;
  return new Promise((resolve) => {
    const req = mod.request(url, { method, timeout: 8000 }, (res) => {
      // Consume and end
      res.resume();
      res.on('end', () => resolve(res.statusCode || 0));
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
    req.end();
  });
}

async function getStatus(url){
  // Try HEAD first to minimize transfer
  let status = await request('HEAD', url);
  if (status === 405 || status === 501 || status === 0) {
    // Fallback to GET if HEAD not allowed or network issue to get better signal
    status = await request('GET', url);
  }
  return status;
}
