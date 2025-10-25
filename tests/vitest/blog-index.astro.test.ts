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

  it('should load posts from content collections', () => {
  expect(fileContent).toContain('await getCollection(\'blog\',');
    expect(fileContent).toContain('const sortedPosts = posts');
  });

  it('should render structured blog layout regions', () => {
    expect(fileContent).toContain('aria-labelledby="blog-posts-heading"');
    expect(fileContent).toContain('<Section padding="lg"');
  });
});
