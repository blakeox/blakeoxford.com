import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SearchOverlay.astro file', () => {
  let content: string;
  const filePath = path.resolve(__dirname, '../src/components/SearchOverlay.astro');

  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should include dialog role and modal attributes', () => {
    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
  });

  it('should have the expected placeholder text in input', () => {
    expect(content).toContain('placeholder="Search for content, projects, blog posts..."');
  });

  it('should include focus trap start and end buttons', () => {
    expect(content).toContain('id="search-focus-start"');
    expect(content).toContain('id="search-focus-end"');
  });
});
