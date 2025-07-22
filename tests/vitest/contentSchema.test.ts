import { describe, it, expect } from 'vitest';
import { collections } from '../../src/content/config';

const { blog } = collections;

describe('Blog frontmatter schema', () => {
  const validBlog = {
    title: 'Test Blog Post',
    description: 'A test blog post description',
    pubDate: new Date('2024-01-01'),
    author: 'Blake Oxford',
    tags: ['test', 'blog'],
    draft: false,
  };

  it('parses valid blog frontmatter', () => {
    const parsed = blog.schema.parse(validBlog);
    expect(parsed).toMatchObject(validBlog);
  });

  it('throws on missing required fields', () => {
    const invalidBlog = {
      title: 'Test Blog Post',
      // Missing description and pubDate
    };

    expect(() => blog.schema.parse(invalidBlog)).toThrow();
  });

  it('throws on invalid types', () => {
    const invalidBlog = {
      title: 123, // Should be string
      description: 'A test blog post description',
      pubDate: new Date('2024-01-01'),
    };

    expect(() => blog.schema.parse(invalidBlog)).toThrow();
  });
});

// Note: Projects are now individual Astro pages, not MDX files with frontmatter
describe('Projects', () => {
  it('projects are now individual Astro pages, not MDX files', () => {
    // This test confirms that projects are no longer part of the content collection
    expect(collections).not.toHaveProperty('projects');
  });
});
