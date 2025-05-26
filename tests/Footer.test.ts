import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../src/components/Footer.astro');
let content: string;

describe('Footer.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should contain a <footer> element', () => {
    expect(content).toContain('<footer');
  });

  it('should have a navigation section with aria-label "Footer Quick Links"', () => {
    expect(content).toContain('role="navigation"');
    expect(content).toContain('aria-label="Footer Quick Links"');
  });

  it('should include LinkedIn and GitHub social links', () => {
    expect(content).toContain('href="https://linkedin.com/in/blake-oxford"');
    expect(content).toContain('href="https://github.com/blakeox"');
  });

  it('should include copyright notice with dynamic year', () => {
    expect(content).toContain('© {year}');
  });

  it('should include a back-to-top link with aria-label', () => {
    expect(content).toContain('href="#top"');
    expect(content).toContain('aria-label="Back to Top"');
  });
});
