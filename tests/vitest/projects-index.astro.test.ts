import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('projects/index.astro', () => {
  let fileContent: string;
  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/pages/projects/index.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should use tokenized container sizing', () => {
    expect(fileContent).toContain('container="xl"');
    expect(fileContent).toContain('container="md"');
  });

  it('should contain semantic HTML structure with proper roles', () => {
    expect(fileContent).toContain('role="region"');
    expect(fileContent).toContain('aria-labelledby');
  });

  it('should render projects via ProjectCard grid', () => {
    expect(fileContent).toContain('<Grid cols="3" gap="lg"');
    expect(fileContent).toContain('<ProjectCard project={project} />');
  });

  it('should contain proper responsive breakpoints and spacing', () => {
    expect(fileContent).toContain('sm:text-5xl');
    expect(fileContent).toContain('md:text-6xl');
    expect(fileContent).toContain('sm:text-base');
  });

  it('should have enhanced accessibility features', () => {
    expect(fileContent).toContain('role="list"');
    expect(fileContent).toContain('aria-label');
    expect(fileContent).toContain('aria-labelledby="results-heading"');
  });

  it('should not use deprecated getCollection pattern', () => {
    expect(fileContent).not.toContain('getCollection(\'projects\')');
  });

  it('should source data from content helper', () => {
    expect(fileContent).toContain('await getProjectsSorted()');
  });
});
