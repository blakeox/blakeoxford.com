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

const root = process.cwd();
const distDir = path.join(root, 'dist');
const base = process.env.BASE_URL || 'http://localhost:4321';
const fail = process.env.DEADLINK_FAIL === 'true';
const reportPath = path.join(root, 'dead-links-report.json');

function walk(dir){
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })){
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function extractUrls(html, filePath){
  const urls = new Set();
  const add = (u)=>{ if (u) urls.add(u); };
  // href and src attributes
  const re = /(href|src)=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = m[2];
    // skip anchors, mailto, tel, data URIs
    if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('data:')) continue;
    // external skip
    if (url.startsWith('http://') || url.startsWith('https://')) continue;
    // normalize relative to root
    if (url.startsWith('/')) add(url);
    else {
      // Construct absolute path from file location
      const rel = path.posix.normalize(path.posix.join('/' + path.posix.relative(distDir, path.dirname(filePath)), url));
      add(rel.replace(/\\/g,'/'));
    }
  }
  return Array.from(urls);
}

(async () => {
  if (!fs.existsSync(distDir)) {
    console.warn('[deadlinks] dist not found, skipping');
    process.exit(0);
  }
  const htmlFiles = walk(distDir);
  const checks = [];
  for (const f of htmlFiles){
    const html = fs.readFileSync(f, 'utf-8');
    const urls = extractUrls(html, f);
    for (const u of urls){
      checks.push({ url: u, ref: path.relative(root, f) });
    }
  }
  // de-dup by url
  const byUrl = new Map();
  for (const c of checks){ if (!byUrl.has(c.url)) byUrl.set(c.url, c); }
  const uniqueChecks = Array.from(byUrl.values());
  const results = [];
  for (const c of uniqueChecks){
    const full = base.replace(/\/$/,'') + c.url;
  const status = await getStatus(full);
  results.push({ url: c.url, status });
  }
  const dead = results.filter(r => r.status === 404 || r.status === 0);
  fs.writeFileSync(reportPath, JSON.stringify({ total: results.length, dead: dead.length, items: results.filter(r=>r.status===404 || r.status===0) }, null, 2));
  console.log(`[deadlinks] checked=${results.length} dead=${dead.length}`);
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
