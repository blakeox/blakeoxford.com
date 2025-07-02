import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock astro:content  
vi.mock('astro:content', () => ({
  getCollection: vi.fn()
}));

import { getStaticPaths, get } from '../../../src/pages/api/blog/[slug].json.js';

// Get a typed version of the mocked function
const mockGetCollection = vi.mocked(await import('astro:content')).getCollection;

const mockBlogPosts = [
  {
    slug: 'first-post',
    data: {
      title: 'First Post',
      description: 'My first blog post',
      date: new Date('2023-01-01'),
      tags: ['tech', 'web']
    },
    body: 'Content of first post'
  },
  {
    slug: 'second-post',
    data: {
      title: 'Second Post',
      description: 'My second blog post',
      date: new Date('2023-02-01'),
      tags: ['tech']
    },
    body: 'Content of second post'
  }
];

describe('Blog slug API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStaticPaths', () => {
    it('should return paths for all blog posts', async () => {
      mockGetCollection.mockResolvedValue(mockBlogPosts);

      const paths = await getStaticPaths();

      expect(mockGetCollection).toHaveBeenCalledWith('blog');
      expect(paths).toHaveLength(2);
      expect(paths[0]).toEqual({ params: { slug: 'first-post' } });
      expect(paths[1]).toEqual({ params: { slug: 'second-post' } });
    });

    it('should handle empty blog collection', async () => {
      mockGetCollection.mockResolvedValue([]);

      const paths = await getStaticPaths();

      expect(paths).toHaveLength(0);
      expect(paths).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return the correct blog post for a given slug', async () => {
      mockGetCollection.mockResolvedValue(mockBlogPosts);

      const result = await get({ params: { slug: 'first-post' } });

      expect(mockGetCollection).toHaveBeenCalledWith('blog');
      expect(result.body).toBe(JSON.stringify(mockBlogPosts[0]));
    });

    it('should return undefined for non-existent slug', async () => {
      mockGetCollection.mockResolvedValue(mockBlogPosts);

      const result = await get({ params: { slug: 'non-existent' } });

      expect(result.body).toBe(JSON.stringify(undefined));
    });

    it('should handle empty slug parameter', async () => {
      mockGetCollection.mockResolvedValue(mockBlogPosts);

      const result = await get({ params: { slug: '' } });

      expect(result.body).toBe(JSON.stringify(undefined));
    });

    it('should handle undefined params', async () => {
      mockGetCollection.mockResolvedValue(mockBlogPosts);

      const result = await get({ params: {} });

      expect(result.body).toBe(JSON.stringify(undefined));
    });

    it('should handle collection fetch error', async () => {
      mockGetCollection.mockRejectedValue(new Error('Collection not found'));

      await expect(get({ params: { slug: 'test' } })).rejects.toThrow('Collection not found');
    });
  });
});
