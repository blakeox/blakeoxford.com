import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock astro:content  
vi.mock('astro:content', () => ({
  getCollection: vi.fn()
}));

import { getStaticPaths, get } from '../../../src/pages/api/projects/[slug].json.js';

// Get a typed version of the mocked function
const mockGetCollection = vi.mocked(await import('astro:content')).getCollection;

const mockProjects = [
  {
    slug: 'first-project',
    data: {
      title: 'First Project',
      description: 'My first project',
      date: new Date('2023-01-01'),
      tags: ['web', 'react']
    },
    body: 'Content of first project'
  },
  {
    slug: 'second-project',
    data: {
      title: 'Second Project',
      description: 'My second project',
      date: new Date('2023-02-01'),
      tags: ['mobile', 'react-native']
    },
    body: 'Content of second project'
  }
];

describe('Projects slug API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStaticPaths', () => {
    it('should return paths for all projects', async () => {
      mockGetCollection.mockResolvedValue(mockProjects);

      const paths = await getStaticPaths();

      expect(mockGetCollection).toHaveBeenCalledWith('projects');
      expect(paths).toHaveLength(2);
      expect(paths[0]).toEqual({ params: { slug: 'first-project' } });
      expect(paths[1]).toEqual({ params: { slug: 'second-project' } });
    });

    it('should handle empty projects collection', async () => {
      mockGetCollection.mockResolvedValue([]);

      const paths = await getStaticPaths();

      expect(paths).toHaveLength(0);
      expect(paths).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return the correct project for a given slug', async () => {
      mockGetCollection.mockResolvedValue(mockProjects);

      const result = await get({ params: { slug: 'first-project' } });

      expect(mockGetCollection).toHaveBeenCalledWith('projects');
      expect(result.body).toBe(JSON.stringify(mockProjects[0]));
    });

    it('should return undefined for non-existent slug', async () => {
      mockGetCollection.mockResolvedValue(mockProjects);

      const result = await get({ params: { slug: 'non-existent' } });

      expect(result.body).toBe(JSON.stringify(undefined));
    });

    it('should handle empty slug parameter', async () => {
      mockGetCollection.mockResolvedValue(mockProjects);

      const result = await get({ params: { slug: '' } });

      expect(result.body).toBe(JSON.stringify(undefined));
    });

    it('should handle undefined params', async () => {
      mockGetCollection.mockResolvedValue(mockProjects);

      const result = await get({ params: {} });

      expect(result.body).toBe(JSON.stringify(undefined));
    });

    it('should handle collection fetch error', async () => {
      mockGetCollection.mockRejectedValue(new Error('Collection not found'));

      await expect(get({ params: { slug: 'test' } })).rejects.toThrow('Collection not found');
    });
  });
});
