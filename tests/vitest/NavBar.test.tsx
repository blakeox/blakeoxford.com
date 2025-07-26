import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('NavBar.astro file', () => {
  const filePath = path.resolve(__dirname, '../../src/components/layout/NavBar.astro');
  let content;
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should contain <nav> element', () => {
    expect(content).toContain('<nav');
  });

  it('should include dynamic navigation analytics attribute', () => {
    // Ensure dynamic binding for analytics attribute is present
    expect(content).toContain('aria-current={Astro.url.pathname === link.href ? \'page\' : undefined}');
  });
});
