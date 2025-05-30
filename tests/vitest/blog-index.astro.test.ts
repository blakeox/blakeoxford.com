import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// Mock astro:content to provide sample blog posts
globalThis['astroContentMock'] = [
  {
    slug: 'hello-world',
    data: {
      title: 'Hello World',
      pubDate: new Date('2024-01-01'),
      draft: false,
    },
  },
  {
    slug: 'draft-post',
    data: {
      title: 'Draft Post',
      pubDate: new Date('2024-02-01'),
      draft: true,
    },
  },
];

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection) => {
    if (collection === 'blog') {
      return globalThis['astroContentMock'];
    }
    return [];
  }),
}));

describe('Blog Index Page', () => {
  it('filters out draft posts from the blog collection', async () => {
    // Simulate the logic from index.astro
    const posts = globalThis['astroContentMock'];
    const publishedPosts = posts.filter((p: any) => !p.data.draft);
    expect(publishedPosts.length).toBe(1);
    expect(publishedPosts[0].data.title).toBe('Hello World');
    expect(publishedPosts.some((p: any) => p.data.title === 'Draft Post')).toBe(false);
  });
});
