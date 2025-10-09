import { describe, it, expect } from 'vitest';
import { normalizeSlug, withLeadingSlash } from '../../src/utils/slug';

describe('slug normalization', () => {
  it('removes leading slash and trailing index', () => {
    expect(normalizeSlug('/blog/index')).toBe('blog/');
  });
  it('collapses multiple slashes', () => {
    expect(normalizeSlug('///blog//post')).toBe('blog/post');
  });
  it('returns undefined for null/undefined', () => {
    expect(normalizeSlug(undefined)).toBeUndefined();
    expect(normalizeSlug(null as any)).toBeUndefined();
  });
});

describe('withLeadingSlash', () => {
  it('adds leading slash when missing', () => {
    expect(withLeadingSlash('blog/post')).toBe('/blog/post');
  });
  it('keeps leading slash', () => {
    expect(withLeadingSlash('/blog/post')).toBe('/blog/post');
  });
});
