import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock astro:content  
vi.mock('astro:content', () => ({
  getCollection: vi.fn()
}));

import { get } from '../../../src/pages/api/blog.json.js';

// Get a typed version of the mocked function
const mockGetCollection = vi.mocked(await import('astro:content')).getCollection;

describe('Blog API endpoint logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data transformation', () => {
    it('should return all blog posts as JSON', async () => {
      const mockPosts = [
        {
          slug: 'first-post',
          data: {
            title: 'First Post',
            description: 'First post description',
            pubDate: new Date('2024-01-01'),
            draft: false
          }
        },
        {
          slug: 'second-post',
          data: {
            title: 'Second Post',
            description: 'Second post description',
            pubDate: new Date('2024-01-02'),
            draft: false
          }
        }
      ];

      mockGetCollection.mockResolvedValue(mockPosts);

      const result = await get();
      const posts = JSON.parse(result.body);

      expect(mockGetCollection).toHaveBeenCalledWith('blog');
      expect(posts).toHaveLength(2);
      expect(posts[0].slug).toBe('first-post');
      expect(posts[1].slug).toBe('second-post');
    });

    it('should handle empty blog collection', async () => {
      mockGetCollection.mockResolvedValue([]);

      const result = await get();
      const posts = JSON.parse(result.body);

      expect(posts).toEqual([]);
    });

    it('should preserve post data structure', async () => {
      const mockPost = {
        slug: 'test-post',
        data: {
          title: 'Test Post',
          description: 'Test description',
          pubDate: new Date('2024-01-01'),
          tags: ['test', 'blog'],
          draft: false,
          author: 'Test Author'
        },
        body: 'Post content here...'
      };

      mockGetCollection.mockResolvedValue([mockPost]);

      const result = await get();
      const posts = JSON.parse(result.body);

      expect(posts[0]).toEqual(mockPost);
      expect(posts[0].data.title).toBe('Test Post');
      expect(posts[0].data.tags).toEqual(['test', 'blog']);
    });
  });

  describe('Error handling', () => {
    it('should handle getCollection errors gracefully', async () => {
      mockGetCollection.mockRejectedValue(new Error('Failed to fetch'));

      await expect(get()).rejects.toThrow('Failed to fetch');
    });
  });

  describe('Response format', () => {
    it('should return proper response structure', async () => {
      mockGetCollection.mockResolvedValue([]);

      const result = await get();

      expect(result).toHaveProperty('body');
      expect(typeof result.body).toBe('string');
      expect(() => JSON.parse(result.body)).not.toThrow();
    });

    it('should return valid JSON string', async () => {
      const mockPosts = [{ slug: 'test', data: { title: 'Test' } }];
      mockGetCollection.mockResolvedValue(mockPosts);

      const result = await get();
      
      expect(typeof result.body).toBe('string');
      const parsed = JSON.parse(result.body);
      expect(parsed).toEqual(mockPosts);
    });
  });
});
