import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../src/components/ProjectCard.astro');
let content: string;

describe('ProjectCard.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should have an article element', () => {
    expect(content).toContain('<article');
  });

  it('should include image with default src or dynamic src', () => {
    expect(content).toContain("src={data.image || '/assets/images/default-project.png'}");
    expect(content).toContain("'/assets/images/default-project.png'");
  });

  it('should include project title link', () => {
    expect(content).toContain('aria-label={`Project: ${data.title}`}');
    expect(content).toContain('<h2');
  });

  it('should render tags list with aria-label', () => {
    expect(content).toContain('aria-label="Project tags"');
    expect(content).toContain('<ul');
  });

  it('should have View Project button', () => {
    expect(content).toContain('View Project');
    expect(content).toContain('aria-label={`View ${data.title}`}');
  });
});
