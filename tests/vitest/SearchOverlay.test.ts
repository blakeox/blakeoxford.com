import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SearchBar.astro file', () => {
  // TODO: Convert to Playwright e2e tests for real DOM testing
  let content: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/components/features/search/SearchBar.astro');
    content = readFileSync(filePath, 'utf-8');
  });

    it('should have the expected placeholder text in input', () => {
      expect(content).toContain('placeholder="Search pages or featured projects"');
  });
  it('should include focus trap start and end buttons', () => {
    expect(content).toContain('id="site-search"');
  });
});
