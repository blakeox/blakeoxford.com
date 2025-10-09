import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../src/components/features/projects/ProjectRow.astro');
let content: string;

describe('ProjectRow.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should render as an article container', () => {
    expect(content).toContain('<article');
  });

  it('should include dynamic project link href', () => {
    expect(content).toContain('href={`/projects/${slug}/`}');
  });

  it('should include accessible project link targeting title', () => {
    expect(content).toContain('aria-label={`View project ${title}`}');
    expect(content).toContain('<h3 class="text-pretty');
    expect(content).toContain('{title}');
  });

  it('should render tags list with correct aria-label', () => {
    expect(content).toContain('aria-label="Project capabilities"');
    expect(content).toContain('<ul class="flex flex-wrap items-center');
  });
});
