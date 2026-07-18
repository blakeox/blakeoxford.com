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

  it('should render as a section container', () => {
    expect(content).toContain('<section');
  });

  it('should include dynamic project link href', () => {
    expect(content).toContain('href={`/projects/${slug}/`}');
  });

  it('should include accessible project title link', () => {
    expect(content).toContain('class="project-title-link');
    expect(content).toContain('focus-visible:ring-2');
    expect(content).toContain('{data.title}');
  });

  it('should render tags list with correct aria-label', () => {
    expect(content).toContain('aria-label="Project tags"');
    expect(content).toMatch(/<ul[^>]*class="[^"]*\bflex\b[^"]*\bflex-wrap\b[^"]*\bgap-2\b/);
  });

  it('should render primary call-to-action with descriptive text', () => {
    expect(content).toContain('View Project: {data.title}');
    expect(content).toContain('bg-button-primary-bg');
    expect(content).toContain('View Project:');
  });
});
