import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../src/layouts/BaseLayout.astro');
let content: string;

describe('BaseLayout.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should include NavBar and Footer components', () => {
    expect(content).toContain('<NavBar />');
    expect(content).toMatch(/<Footer\b/);
  });

  it('should have meta description and viewport meta tags via DocumentMeta', () => {
    expect(content).toContain('DocumentMeta');
  });

  it('should include a <main> element with slot', () => {
    expect(content).toContain('<main');
    expect(content).toContain('<slot />');
  });

  it('should use dynamic title prop in DocumentMeta', () => {
    expect(content).toContain('title={title}');
  });

  it('should use a neutral main shell without global prose', () => {
    expect(content).toMatch(/const mainClasses = wide\s*\?/);
    expect(content).toContain('layout-gutter');
    expect(content).not.toMatch(/mainClasses[\s\S]*prose/);
    // Global prose belongs on Prose.astro / article pages only
    expect(content).not.toContain("'... prose'");
    expect(content).not.toContain('text-foreground prose');
  });

  it('should boot analytics and a11y via SiteClientScripts, not React islands', () => {
    expect(content).toContain('SiteClientScripts');
    expect(content).not.toContain('client:only="react"');
    expect(content).not.toContain('ServiceWorkerIsland');
    expect(content).not.toContain('ClarityIsland');
  });
});
