import { describe, it, expect, vi, beforeAll } from 'vitest';
import { getStaticPaths, get } from '../../src/pages/api/blog/[slug].json.js';

// Mock the getCollection function
vi.mock('astro:content');

describe('blog/[slug].json API endpoint', () => {
  describe('getStaticPaths', () => {
    it('returns paths for all blog posts', async () => {
      // Get the paths
      const paths = await getStaticPaths();
      
      // Verify the structure and content of the paths
      expect(paths).toBeInstanceOf(Array);
      expect(paths).toHaveLength(2);
      
      // Check if it contains entries for each blog post
      expect(paths).toContainEqual({ params: { slug: 'hello-world' } });
      expect(paths).toContainEqual({ params: { slug: 'second-post' } });
    });
  });
  
  describe('get', () => {
    it('returns the correct post when given an existing slug', async () => {
      // Call the API endpoint with the first post's slug
      const response = await get({ params: { slug: 'hello-world' } });
      
      // Parse the returned JSON body
      const post = JSON.parse(response.body);
      
      // Verify the structure and content of the post
      expect(post).toHaveProperty('slug', 'hello-world');
      expect(post).toHaveProperty('data.title', 'Hello World');
      expect(post).toHaveProperty('data.description', 'My first post');
    });
    
    it('returns undefined when given a non-existent slug', async () => {
      // Call the API endpoint with a non-existent slug
      const response = await get({ params: { slug: 'non-existent' } });
      
      // Parse the returned JSON body
      const post = JSON.parse(response.body);
      
      // Verify that the post is undefined
      expect(post).toBeUndefined();
    });
  });
});
