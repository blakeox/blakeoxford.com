import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('projects/index.astro', () => {
  let fileContent: string;
  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/pages/projects/index.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should frame the page as a portfolio showcase', () => {
    expect(fileContent).toContain('ProjectsCapabilitiesSection');
    expect(fileContent).toContain('ProjectsFeaturedSection');
    expect(fileContent).toContain('ProjectsLibrarySection');
    expect(fileContent).toContain('getProjectInsights');
  });

  it('should keep results as supporting proof', () => {
    expect(fileContent).toContain('ProjectsFindingsSection');
    expect(fileContent).toContain('ProjectsCTASection');
  });

  it('should have accessible hero landmarks', () => {
    expect(fileContent).toContain('id="projects-hero"');
    expect(fileContent).toContain('shell="projects-hero-inner"');
  });

  it('should not use deprecated getCollection pattern', () => {
    expect(fileContent).not.toContain("getCollection('projects')");
  });

  it('should source insights from content helper', () => {
    expect(fileContent).toContain('await getProjectInsights()');
  });
});
