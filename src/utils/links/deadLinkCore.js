/**
 * Dead Link Core Utilities
 * Pure functions to extract links from built HTML and prepare check tasks.
 * Kept framework-agnostic for unit testing.
 */

import fs from 'fs';
import path from 'path';

const SKIP_PROTOCOLS = ['mailto:', 'tel:', 'data:'];

function findTagStart(lowerHtml, tagName, fromIndex) {
  const marker = `<${tagName}`;
  let start = lowerHtml.indexOf(marker, fromIndex);
  while (start !== -1) {
    const boundary = lowerHtml[start + marker.length];
    if (
      boundary === undefined ||
      boundary === '>' ||
      boundary === '/' ||
      boundary === ' ' ||
      boundary === '\t' ||
      boundary === '\r' ||
      boundary === '\n'
    ) {
      return start;
    }
    start = lowerHtml.indexOf(marker, start + 1);
  }
  return -1;
}

function stripNonContentRegions(html) {
  const lowerHtml = html.toLowerCase();
  let cursor = 0;
  let output = '';

  while (cursor < html.length) {
    const candidates = [
      { start: lowerHtml.indexOf('<!--', cursor), type: 'comment' },
      { start: findTagStart(lowerHtml, 'script', cursor), type: 'script' },
      { start: findTagStart(lowerHtml, 'style', cursor), type: 'style' },
    ].filter(({ start }) => start !== -1);

    if (candidates.length === 0) break;

    const next = candidates.reduce((earliest, candidate) =>
      candidate.start < earliest.start ? candidate : earliest
    );
    output += html.slice(cursor, next.start);

    if (next.type === 'comment') {
      const end = lowerHtml.indexOf('-->', next.start + 4);
      if (end === -1) return output + html.slice(next.start);
      cursor = end + 3;
      continue;
    }

    const tagName = next.type;
    const openingEnd = lowerHtml.indexOf('>', next.start + tagName.length + 1);
    if (openingEnd === -1) return output + html.slice(next.start);

    const closingStart = lowerHtml.indexOf(`</${tagName}`, openingEnd + 1);
    if (closingStart === -1) return output + html.slice(next.start);

    const closingEnd = lowerHtml.indexOf('>', closingStart + tagName.length + 2);
    if (closingEnd === -1) return output + html.slice(next.start);
    cursor = closingEnd + 1;
  }

  return output + html.slice(cursor);
}

/**
 * Extract URLs (internal + optionally external) from an HTML string.
 * Returns array of objects: { raw, isExternal }
 */
export function extractLinks(html, { includeExternal = false } = {}) {
  const links = new Map();
  // Strip comments / script / style so JS template strings like href="${t}" are not treated as links.
  const cleaned = stripNonContentRegions(html);
  const attrRe = /(href|src)=["']([^"']+)["']/gi;
  let m;
  while ((m = attrRe.exec(cleaned))) {
    const url = m[2];
    if (!url) continue;
    if (url.startsWith('#')) continue;
    // Ignore uninterpolated template literals that leaked into attribute text.
    if (url.includes('${')) continue;
    if (SKIP_PROTOCOLS.some((p) => url.startsWith(p))) continue;
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
          .then((res) => {
            results[idx] = res;
          })
          .catch((err) => {
            results[idx] = { error: err?.message || 'error' };
          })
          .finally(() => {
            active--;
            maybeNext();
          });
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
  const parts = patternRaw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const regexes = parts
    .map((p) => {
      try {
        return new RegExp(p);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  if (!regexes.length) return () => false;
  return (value) => regexes.some((r) => r.test(value));
}
