import { describe, it, expect } from 'vitest';
import { collections } from '../../src/content/config';

describe('Content Collections', () => {
  it('should have no collections since blog posts are now individual Astro files', () => {
    // Blog posts are now individual Astro files, not MDX content collections
    expect(collections).toEqual({});
  });

  it('projects are now individual Astro pages, not MDX files', () => {
    // This test confirms that projects are no longer part of the content collection
    expect(collections).not.toHaveProperty('projects');
  });
});
