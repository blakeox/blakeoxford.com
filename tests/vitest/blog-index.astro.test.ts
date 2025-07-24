import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('Blog Index Page', () => {
  let fileContent: string;
  
  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/pages/blog/index.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should contain the Blog heading', () => {
    expect(fileContent).toContain('Blog');
  });

  it('should contain BlogPostRow component', () => {
    expect(fileContent).toContain('BlogPostRow');
  });

  it('should use content collections for blog posts', () => {
    expect(fileContent).toContain('getCollection(\'blog\'');
  });
});
