import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('projects/index.astro', () => {
  let fileContent: string;
  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/pages/projects/index.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should contain the Projects heading', () => {
    expect(fileContent).toContain('Projects');
  });

  it('should contain ProjectRow component', () => {
    expect(fileContent).toContain('ProjectRow');
  });

  it('should not use getCollection for projects since they are now individual Astro pages', () => {
    expect(fileContent).not.toContain("getCollection('projects')");
  });
});
