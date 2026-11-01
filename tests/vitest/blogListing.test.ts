import { describe, expect, it } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import { getBlogListing } from '@/content/blog/getBlogListing';

function post(
  id: string,
  date: string,
  options: { draft?: boolean; featured?: boolean; heroImage?: string } = {}
) {
  return {
    id,
    data: { pubDate: new Date(date), ...options },
  } as CollectionEntry<'blog'>;
}

describe('Writing editorial sequence', () => {
  it('leads with the newest published essay even when it has no image or feature flag', () => {
    const latest = post('latest', '2026-07-21');
    const older = post('older', '2026-01-08', { featured: true, heroImage: '/older.webp' });
    const draft = post('draft', '2026-10-01', { draft: true });
    const listing = getBlogListing([older, draft, latest]);

    expect(listing.featuredPost).toBe(latest);
    expect(listing.archivePosts).toEqual([older]);
  });

  it('preserves every published essay exactly once in newest-first order', () => {
    const posts = [post('a', '2025-01-01'), post('c', '2026-01-01'), post('b', '2025-06-01')];
    const { featuredPost, archivePosts } = getBlogListing(posts);
    const ids = [featuredPost, ...archivePosts].map((entry) => entry.id);

    expect(ids).toEqual(['c', 'b', 'a']);
    expect(new Set(ids).size).toBe(posts.length);
    expect(posts.map((entry) => entry.id)).toEqual(['a', 'c', 'b']);
  });

  it('does not create an archive duplicate for a single essay', () => {
    const essay = post('only', '2026-07-21');
    expect(getBlogListing([essay])).toEqual({ featuredPost: essay, archivePosts: [] });
  });

  it.each([
    { name: 'empty', entries: [] },
    { name: 'draft-only', entries: [post('draft', '2026-07-21', { draft: true })] },
  ])('supports a $name collection', ({ entries }) => {
    expect(getBlogListing(entries)).toEqual({ featuredPost: undefined, archivePosts: [] });
  });
});
