import { describe, it, expect } from 'vitest';
import {
  extractLinks,
  buildLinkTasks,
  buildAllowlist,
} from '../../../src/utils/links/deadLinkCore';
import path from 'path';
import fs from 'fs';

// Minimal fixture HTML for internal and external links
const html = `
<html><body>
  <a href="/about">About</a>
  <a href="contact/index.html">Contact</a>
  <img src="/assets/img/logo.png" />
  <a href="https://example.com/remote">External</a>
  <a href="#hash">Hash</a>
  <a href="mailto:test@example.com">Mail</a>
</body></html>`;

// Create a temporary test dist structure in memory (simulate path resolution)
const tempRoot = path.join(process.cwd(), '.tmp-deadlink-test');
const distDir = path.join(tempRoot, 'dist');
const pageDir = path.join(distDir, 'contact');
const pageFile = path.join(pageDir, 'index.html');

function setup() {
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(pageFile, html, 'utf-8');
}

function teardown() {
  if (fs.existsSync(tempRoot)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

describe('deadLinkCore', () => {
  it('extractLinks internal only', () => {
    const links = extractLinks(html, { includeExternal: false });
    const urls = links.map((l) => l.raw).sort();
    expect(urls).toContain('/about');
    expect(urls).toContain('contact/index.html');
    expect(urls).toContain('/assets/img/logo.png');
    expect(urls).not.toContain('https://example.com/remote');
  });

  it('extractLinks with external', () => {
    const links = extractLinks(html, { includeExternal: true });
    const urls = links.map((l) => l.raw);
    expect(urls).toContain('https://example.com/remote');
  });

  it('buildLinkTasks normalizes relative paths', () => {
    setup();
    const tasks = buildLinkTasks([pageFile], distDir, { includeExternal: false });
    const paths = tasks.map((t) => t.urlPath).sort();
    expect(paths).toContain('/about');
    expect(paths).toContain('/contact/index.html');
    expect(paths).toContain('/assets/img/logo.png');
    teardown();
  });

  it('allowlist pattern matches', () => {
    const allow = buildAllowlist('^/assets|remote');
    expect(allow('/assets/img/logo.png')).toBe(true);
    expect(allow('https://foo.com/remote')).toBe(true);
    expect(allow('/about')).toBe(false);
  });
});
