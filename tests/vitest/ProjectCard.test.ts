import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../src/components/features/projects/ProjectCard.astro');
let content: string;

// TODO: Convert to Playwright e2e tests for real component rendering
describe.skip('ProjectCard.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should have an article element', () => {
    expect(content).toContain('<article');
  });

  it('should configure image fallback and metadata', () => {
  expect(content).toContain('const image = data?.heroImage ?? \'/assets/images/blake-logo-fallback.png\';');
    expect(content).toContain('alt={`${title} preview`}');
    expect(content).toContain('loading="lazy"');
  });

  it('should include project title link with aria-labelledby pattern', () => {
    expect(content).toContain('<h3 id={`project-card-${slug}`}');
    expect(content).toContain('href={`/projects/${slug}/`}');
    expect(content).toContain('{title}');
    expect(content).toContain('aria-labelledby={`project-card-${slug}`}');
  });

  it('should render tags list with descriptive aria-label', () => {
    expect(content).toContain('aria-label="Project focus areas"');
    expect(content).toContain('<ul class="flex flex-wrap items-center');
  });

  it('should expose a visible CTA without extra aria-label', () => {
    expect(content).toContain('<span class="inline-flex items-center gap-2 rounded-full border-2 border-accent/60');
    expect(content).toContain('Explore');
    expect(content).not.toContain('aria-label={`View ${data.title}`}');
  });
});
