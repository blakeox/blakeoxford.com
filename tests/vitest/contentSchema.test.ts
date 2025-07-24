import { describe, it, expect } from 'vitest';
import { collections } from '../../src/content/config';

describe('Content Collections', () => {
  it('should have blog collection configured with proper schema', () => {
    // Blog collection should exist with required schema
    expect(collections).toHaveProperty('blog');
    expect(collections.blog).toHaveProperty('schema');
  });

  it('should have projects collection configured with proper schema', () => {
    // Projects collection should exist with required schema
    expect(collections).toHaveProperty('projects');
    expect(collections.projects).toHaveProperty('schema');
  });
});
