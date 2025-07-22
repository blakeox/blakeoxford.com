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

  it('should not use getCollection for blog since they are now individual Astro pages', () => {
    expect(fileContent).not.toContain("getCollection('blog')");
  });

  it('should define blog posts as static data', () => {
    expect(fileContent).toContain('// Define blog posts data manually');
  });
});
