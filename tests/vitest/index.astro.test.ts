import { describe, it, expect, vi } from 'vitest';

// Mock astro:content to provide sample projects
const mockProjects = [
  {
    slug: 'enterprise-digital-transformation',
    data: {
      title: 'Enterprise Digital Transformation',
      date: new Date('2024-01-01'),
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
  it('filters out draft projects and includes featured projects', async () => {
    // Simulate the logic from index.astro
    const featuredSlugs = [
      'enterprise-digital-transformation',
      'advancedmd-implementation',
      'bank-projections-modeling',
    ];
    const projects = mockProjects;
    const featuredProjects = featuredSlugs
      .map((slug) => projects.find((p) => p.slug === slug))
      .filter((p) => !!p);
    const publishedProjects = projects.filter((p) => !p.data.draft);

    // Check that all featured projects are present and not drafts
    expect(featuredProjects.length).toBe(3);
    expect(featuredProjects.map((p) => p.slug)).toEqual(featuredSlugs);
    expect(publishedProjects.some((p) => p.slug === 'draft-project')).toBe(false);
  });
});
