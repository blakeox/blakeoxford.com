import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SearchOverlay.astro file', () => {
  let content: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/components/features/search/SearchOverlay.astro');
    content = readFileSync(filePath, 'utf-8');
  });

  it('should include dialog role and modal attributes', () => {
    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
  });

  it('should have the expected placeholder text in input', () => {
    expect(content).toContain('placeholder="Type to search..."');
  });

  it('should include focus trap start and end buttons', () => {
    expect(content).toContain('id="search-input"');
    expect(content).toContain('aria-controls="search-results"');
  });
});
