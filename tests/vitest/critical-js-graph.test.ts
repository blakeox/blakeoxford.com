import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CRITICAL_JS_GZIP_LIMIT,
  auditCriticalJs,
  htmlScriptSources,
  staticImportSpecifiers,
} from '../../scripts/build/critical-js-graph.mjs';

describe('critical JS graph', () => {
  it('follows static imports and skips dynamic import targets', () => {
    const source = [
      'import { n as e } from "./vendor-sentry.js";',
      'import "./analytics.js";',
      'import("./chatLoader.js");',
      'const lazy = import("./sentry-browser.js");',
    ].join('\n');
    expect(staticImportSpecifiers(source)).toEqual(['./vendor-sentry.js', './analytics.js']);
  });

  it('collects module scripts and modulepreload links', () => {
    const html =
      '<script type="module" src="/_astro/page.js"></script>' +
      '<link rel="modulepreload" href="/_astro/vendor-sentry.js">' +
      '<script src="/js/ai-chat-launcher.js?v=abc" defer></script>';
    expect(htmlScriptSources(html)).toEqual(['/_astro/page.js', '/_astro/vendor-sentry.js']);
  });

  it('fails when the static graph contains Sentry or React', () => {
    const dist = mkdtempSync(join(tmpdir(), 'critical-js-'));
    const astro = join(dist, '_astro');
    mkdirSync(astro, { recursive: true });
    writeFileSync(join(astro, 'page.js'), 'import "./vendor-sentry.js";');
    writeFileSync(
      join(astro, 'vendor-sentry.js'),
      'dsn:"https://public@o4512297421897728.ingest.us.sentry.io/0"'
    );
    const html = '<script type="module" src="/_astro/page.js"></script>';
    for (const page of [
      'index.html',
      'about/index.html',
      'projects/index.html',
      'blog/index.html',
    ]) {
      const directory = join(dist, page, '..');
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(dist, page), html);
    }

    const { failures } = auditCriticalJs(dist);
    expect(failures.some((failure) => failure.includes('ingest.us.sentry.io'))).toBe(true);
    expect(failures.some((failure) => failure.includes(String(CRITICAL_JS_GZIP_LIMIT)))).toBe(
      false
    );
  });

  it('passes a small page shell that dynamic-imports Sentry', () => {
    const dist = mkdtempSync(join(tmpdir(), 'critical-js-ok-'));
    const astro = join(dist, '_astro');
    mkdirSync(astro, { recursive: true });
    writeFileSync(join(astro, 'page.js'), 'import("./sentry-browser.js");');
    writeFileSync(
      join(astro, 'sentry-browser.js'),
      'ingest.us.sentry.io rendererPackageName ZodError'
    );
    const html = '<script type="module" src="/_astro/page.js"></script>';
    for (const page of [
      'index.html',
      'about/index.html',
      'projects/index.html',
      'blog/index.html',
    ]) {
      mkdirSync(join(dist, page, '..'), { recursive: true });
      writeFileSync(join(dist, page), html);
    }

    const { failures, pages } = auditCriticalJs(dist);
    expect(failures).toEqual([]);
    expect(pages[0]?.gzipBytes).toBeLessThan(CRITICAL_JS_GZIP_LIMIT);
  });
});
