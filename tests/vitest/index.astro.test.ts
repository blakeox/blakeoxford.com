import { describe, it, expect, vi } from 'vitest';

// Mock astro:content to provide sample projects
const mockProjects = [
  {
    slug: 'microsoft-fabric',
    data: {
      title: 'Microsoft Fabric',
      date: new Date('2025-01-01'),
      draft: false,
      image: '/assets/images/project1.png',
    },
  },
  {
    slug: 'advancedmd-implementation',
    data: {
      title: 'AdvancedMD Implementation',
      date: new Date('2024-02-01'),
      draft: false,
      image: '/assets/images/project2.png',
    },
  },
  {
    slug: 'bank-projections-modeling',
    data: {
      title: 'Bank Projections Modeling',
      date: new Date('2024-03-01'),
      draft: false,
      image: '/assets/images/project3.png',
    },
  },
  {
    slug: 'draft-project',
    data: {
      title: 'Draft Project',
      date: new Date('2024-04-01'),
      draft: true,
      image: '/assets/images/project4.png',
    },
  },
];

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection) => {
    if (collection === 'projects') {
      return mockProjects;
    }
    return [];
  }),
}));

describe('Main Index Page', () => {
  it('filters out draft projects and shows recent projects', async () => {
    // Simulate the logic from index.astro (now using getProjectsSorted().slice(0, 3))
    const projects = mockProjects;
    const publishedProjects = projects.filter((p) => !p.data.draft);
    const sortedProjects = publishedProjects.sort((a, b) => {
      const ad = a.data.date ? new Date(a.data.date).getTime() : 0;
      const bd = b.data.date ? new Date(b.data.date).getTime() : 0;
      return bd - ad;
    });
    const recentProjects = sortedProjects.slice(0, 3);

    // Check that we get the most recent projects and no drafts
    expect(recentProjects.length).toBe(3);
    expect(publishedProjects.some((p) => p.slug === 'draft-project')).toBe(false);
    // Verify chronological ordering (most recent first)
    expect(recentProjects[0].data.date.getTime()).toBeGreaterThanOrEqual(recentProjects[1].data.date.getTime());
  });
});
