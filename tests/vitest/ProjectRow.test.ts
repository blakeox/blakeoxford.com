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

  it('should use modern article element with semantic structure', () => {
    expect(content).toContain('<article');
    expect(content).toContain('project-row group relative');
  });

  it('should include dynamic project link href', () => {
    expect(content).toContain('href={`/projects/${slug}/`}');
  });

  it('should have proper accessibility attributes', () => {
    // Should have descriptive aria-labels for case study links
    expect(content).toContain('aria-label={`View detailed case study: ${data.title}`}');
    expect(content).toContain('aria-label={`View detailed case study for ${data.title}`}');
  });

  it('should render tags with proper semantic structure', () => {
    expect(content).toContain('role="group"');
    expect(content).toContain('aria-label="Project technologies"');
    // Uses div with spans instead of ul/li for better modern styling
    expect(content).toContain('<div class="project-tags"');
  });
});
