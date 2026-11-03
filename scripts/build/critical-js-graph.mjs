/**
 * Critical-path JavaScript budget.
 *
 * Follows static module imports from each content page. Dynamic import()
 * targets (Sentry, React islands, search, chat) stay out of this graph.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const CONTENT_PAGES = [
  'index.html',
  'about/index.html',
  'projects/index.html',
  'blog/index.html',
];

/** Gzip bytes. The eager Sentry graph was ~193KB; the page shell is ~14KB. */
export const CRITICAL_JS_GZIP_LIMIT = 64 * 1024;

export const FORBIDDEN_CRITICAL_MARKERS = [
  'ingest.us.sentry.io',
  'rendererPackageName',
  'ZodError',
];

const DYNAMIC_IMPORT = /import\s*\(\s*["']\.\/[^"']+\.js["']\s*\)/g;
const STATIC_IMPORT = /(?:from|import)\s*["'](\.\/[^"']+\.js)["']/g;
const SCRIPT_SRC = /<script\b[^>]*\bsrc=["']([^"']+\.js)["'][^>]*>/gi;
const MODULE_PRELOAD =
  /<link\b(?=[^>]*\brel=["']modulepreload["'])(?=[^>]*\bhref=["']([^"']+\.js)["'])[^>]*>/gi;

export function staticImportSpecifiers(source) {
  const withoutDynamic = source.replace(DYNAMIC_IMPORT, '');
  return [...withoutDynamic.matchAll(STATIC_IMPORT)].map((match) => match[1]);
}

export function htmlScriptSources(html) {
  const sources = new Set();
  for (const match of html.matchAll(SCRIPT_SRC)) addAssetSource(sources, match[1]);
  for (const match of html.matchAll(MODULE_PRELOAD)) addAssetSource(sources, match[1]);
  return [...sources];
}

function addAssetSource(sources, raw) {
  const src = raw.split('?')[0];
  if (src.startsWith('/_astro/') || src.startsWith('/assets/')) sources.add(src);
}

export function walkStaticGraph(entryAbsolutePaths, readFile) {
  const sources = new Map();
  const queue = [...entryAbsolutePaths];
  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || sources.has(file)) continue;
    let source;
    try {
      source = readFile(file);
    } catch {
      continue;
    }
    sources.set(file, source);
    const directory = dirname(file);
    for (const specifier of staticImportSpecifiers(source)) {
      queue.push(resolve(directory, specifier));
    }
  }
  return sources;
}

export function auditCriticalJs(distDir, readFile = (file) => readFileSync(file, 'utf8')) {
  const failures = [];
  const pages = [];

  for (const page of CONTENT_PAGES) {
    const htmlPath = join(distDir, page);
    if (!existsSync(htmlPath)) {
      failures.push(`${page} is missing from ${distDir}`);
      continue;
    }
    const html = readFile(htmlPath);
    const entries = htmlScriptSources(html).map((src) => join(distDir, src.slice(1)));
    const graph = walkStaticGraph(entries, readFile);
    let gzipBytes = 0;
    const files = [];
    for (const [file, source] of graph) {
      const bytes = Buffer.from(source);
      gzipBytes += gzipSync(bytes).length;
      files.push(file);
      for (const marker of FORBIDDEN_CRITICAL_MARKERS) {
        if (source.includes(marker)) {
          failures.push(`${page} critical JS ${file} contains ${marker}`);
        }
      }
    }
    pages.push({ page, files: files.length, gzipBytes });
    if (gzipBytes > CRITICAL_JS_GZIP_LIMIT) {
      failures.push(
        `${page} critical JS is ${gzipBytes} bytes gzip (limit ${CRITICAL_JS_GZIP_LIMIT})`
      );
    }
  }

  return { failures, pages };
}

function isCli() {
  const entry = process.argv[1];
  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}

if (isCli()) {
  const distDir = process.argv[2] ?? 'dist';
  const { failures, pages } = auditCriticalJs(distDir);
  for (const page of pages) {
    console.log(
      `  ${page.page}: ${(page.gzipBytes / 1024).toFixed(1)}KB gzip across ${page.files} files`
    );
  }
  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log('✅ Critical-path JavaScript excludes Sentry, React, and zod');
}
