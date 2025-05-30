import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// Mock astro:content getCollection
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection) => {
    if (collection === 'projects') {
      return [
        {
          slug: 'test-project-1',
          data: {
            title: 'Test Project 1',
            date: new Date('2024-01-01'),
            draft: false,
            tags: ['Tag1'],
            image: '/assets/images/test1.png',
            description: 'Description 1',
          },
        },
        {
          slug: 'test-project-2',
          data: {
            title: 'Test Project 2',
            date: new Date('2024-02-01'),
            draft: false,
            tags: ['Tag2'],
            image: '/assets/images/test2.png',
            description: 'Description 2',
          },
        },
      ];
    }
    return [];
  }),
}));

describe('projects/index.astro', () => {
  let fileContent: string;
  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/pages/projects/index.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should contain the Projects heading', () => {
    expect(fileContent).toContain('Projects');
  });

  it('should contain ProjectRow component', () => {
    expect(fileContent).toContain('ProjectRow');
  });

  it('should use getCollection for projects', () => {
    expect(fileContent).toContain("getCollection('projects')");
  });
});
