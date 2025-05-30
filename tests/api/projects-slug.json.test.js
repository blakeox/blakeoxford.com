import { describe, it, expect, vi, beforeAll } from 'vitest';
import { getStaticPaths, get } from '../../../src/pages/api/projects/[slug].json.js';

// Mock the getCollection function
vi.mock('astro:content');

describe('projects/[slug].json API endpoint', () => {
  describe('getStaticPaths', () => {
    it('returns paths for all projects', async () => {
      // Get the paths
      const paths = await getStaticPaths();
      
      // Should be an array
      expect(paths).toBeInstanceOf(Array);
      // Example: expect(paths).toHaveLength(3);
      // You can adjust the length based on your mock
      expect(paths[0]).toHaveProperty('params.slug');
    });
  });
  
  describe('get', () => {
    it('returns the correct project when given an existing slug', async () => {
      // Call the API endpoint with a known slug
      const response = await get({ params: { slug: 'enterprise-digital-transformation' } });
      const project = JSON.parse(response.body);
      expect(project).toHaveProperty('slug', 'enterprise-digital-transformation');
      expect(project).toHaveProperty('data.title');
    });
    
    it('returns undefined when given a non-existent slug', async () => {
      const response = await get({ params: { slug: 'non-existent' } });
      const project = JSON.parse(response.body);
      expect(project).toBeUndefined();
    });
  });
});
