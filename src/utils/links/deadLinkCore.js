/**
 * Dead Link Core Utilities
 * Pure functions to extract links from built HTML and prepare check tasks.
 * Kept framework-agnostic for unit testing.
 */

import fs from 'fs';
import path from 'path';

const SKIP_PROTOCOLS = ['mailto:', 'tel:', 'data:'];

/**
 * Extract URLs (internal + optionally external) from an HTML string.
 * Returns array of objects: { raw, isExternal }
 */
export function extractLinks(html, { includeExternal = false } = {}) {
  const links = new Map();
  // Strip HTML comments to avoid catching commented-out attrs (e.g., //www.googletagmanager.com)
  const withoutComments = html.replace(/<!--([\s\S]*?)-->/g, '');
  const attrRe = /(href|src)=["']([^"']+)["']/gi;
  let m;
  while ((m = attrRe.exec(withoutComments))) {
    const url = m[2];
    if (!url) continue;
    if (url.startsWith('#')) continue;
    if (SKIP_PROTOCOLS.some(p => url.startsWith(p))) continue;
    // Protocol-relative URLs '//' should be considered external
    const isProtocolRelative = url.startsWith('//');
    const isHttp = url.startsWith('http://') || url.startsWith('https://') || isProtocolRelative;
    if (isHttp && !includeExternal) continue;
    if (isHttp || url.startsWith('/') || !url.includes('://')) {
      // treat bare relative paths (no protocol, no leading slash) as internal candidates
      links.set(url, { raw: url, isExternal: isHttp });
    }
  }
  return Array.from(links.values());
}

/**
 * Walk a directory recursively collecting .html file paths.
 */
export function collectHtmlFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const ent of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name.endsWith('.html')) out.push(full);
    }
  }
  return out;
}

/**
 * Build check tasks from html files. Each task: { urlPath, isExternal, ref }
 * Internal links are kept as root-relative paths.
 */
export function buildLinkTasks(htmlFiles, distDir, { includeExternal = false }) {
  const tasks = [];
  for (const f of htmlFiles) {
    const html = fs.readFileSync(f, 'utf-8');
    const found = extractLinks(html, { includeExternal });
    for (const l of found) {
      let urlPath = l.raw;
      if (!l.isExternal) {
        // ensure root-relative
        if (!urlPath.startsWith('/')) {
          // Treat bare relative references as root-relative rather than page-directory relative.
          // This prevents duplicated nesting like /contact/contact/index.html when a page under /contact/
          // links to "contact/index.html" intending the canonical /contact/ page.
          urlPath = path.posix.normalize('/' + urlPath).replace(/\\/g, '/');
        }
      }
      tasks.push({ urlPath, isExternal: l.isExternal, ref: path.relative(process.cwd(), f) });
    }
  }
  // de-duplicate by urlPath
  const map = new Map();
  for (const t of tasks) if (!map.has(t.urlPath)) map.set(t.urlPath, t);
  return Array.from(map.values());
}

/**
 * Simple promise pool to limit concurrency.
 */
export async function runPool(items, limit, worker) {
  const results = [];
  let i = 0;
  let active = 0;
  return await new Promise((resolve) => {
    const maybeNext = () => {
      if (i === items.length && active === 0) return resolve(results);
      while (active < limit && i < items.length) {
        const idx = i++;
        active++;
        Promise.resolve(worker(items[idx], idx))
          .then(res => { results[idx] = res; })
          .catch(err => { results[idx] = { error: err?.message || 'error' }; })
          .finally(() => { active--; maybeNext(); });
      }
    };
    maybeNext();
  });
}

/**
 * Build allowlist tester from string pattern(s). Pipe `|` retains meaning inside a single regex.
 * Accepts comma-separated list OR single regex string; returns predicate(urlPathOrFull) => boolean.
 */
export function buildAllowlist(patternRaw) {
  if (!patternRaw) return () => false;
  const parts = patternRaw.split(',').map(p => p.trim()).filter(Boolean);
  const regexes = parts.map(p => {
    try { return new RegExp(p); } catch { return null; }
  }).filter(Boolean);
  if (!regexes.length) return () => false;
  return (value) => regexes.some(r => r.test(value));
}
