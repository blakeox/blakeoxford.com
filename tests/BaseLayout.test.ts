import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../src/layouts/BaseLayout.astro');
let content: string;

describe('BaseLayout.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should include NavBar and Footer components', () => {
    expect(content).toContain('<NavBar />');
    expect(content).toContain('<Footer />');
  });

  it('should have meta description and viewport meta tags', () => {
    expect(content).toContain('<meta name="description"');
    expect(content).toContain('<meta name="viewport"');
  });

  it('should include a <main> element with slot', () => {
    expect(content).toContain('<main');
    expect(content).toContain('<slot />');
  });

  it('should use dynamic title prop in <title>', () => {
    expect(content).toContain('<title>{title}</title>');
  });

  it('should include conditional classes for wide layout', () => {
    expect(content).toContain("${wide ? 'max-w-none px-0' : 'max-w-3xl mx-auto p-4'}");
  });
});
