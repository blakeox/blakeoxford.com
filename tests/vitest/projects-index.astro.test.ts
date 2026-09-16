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

  it('should keep conversion on the closing band', () => {
    expect(fileContent).toContain('ProjectsCTASection');
    expect(fileContent).not.toContain('ProjectsFindingsSection');
    expect(fileContent).not.toContain('meta.results');
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
