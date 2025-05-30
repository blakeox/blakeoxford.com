import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../src/components/ProjectRow.astro');
let content: string;

describe('ProjectRow.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should have a section element', () => {
    expect(content).toContain('<section');
  });

  it('should include dynamic project link href', () => {
    expect(content).toContain('href={`/projects/${slug}/`}');
  });

  it('should include aria-label for project title', () => {
    expect(content).toContain('aria-label={`Project: ${data.title}`}');
  });

  it('should render tags list with correct aria-label', () => {
    expect(content).toContain('aria-label="Project tags"');
    expect(content).toContain('<ul');
  });
});
