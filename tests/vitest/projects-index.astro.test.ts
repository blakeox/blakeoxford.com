import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('projects/index.astro', () => {
  let fileContent: string;
  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/pages/projects/index.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should use modern container spacing utilities', () => {
    expect(fileContent).toContain('max-w-6xl');
  });

  it('should contain semantic HTML structure with proper roles', () => {
    expect(fileContent).toContain('role="region"');
    expect(fileContent).toContain('aria-labelledby');
  });

  it('should use ProjectDetailSection component for better composition', () => {
    expect(fileContent).toContain('ProjectDetailSection');
  });

  it('should contain proper responsive breakpoints and spacing', () => {
    expect(fileContent).toContain('sm:');
    expect(fileContent).toContain('md:');
    expect(fileContent).toContain('lg:');
  });

  it('should have enhanced accessibility features', () => {
    expect(fileContent).toContain('role="list"');
    expect(fileContent).toContain('aria-label');
    expect(fileContent).toContain('focus-visible:');
  });

  it('should not use deprecated getCollection pattern', () => {
    expect(fileContent).not.toContain('getCollection(\'projects\')');
  });
});
