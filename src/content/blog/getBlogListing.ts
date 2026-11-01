import type { CollectionEntry } from 'astro:content';
import { isPublished } from '@/lib/content/publication-contract.mjs';

/** Latest means publication date, independent of imagery or editorial feature flags. */
export function getBlogListing(posts: readonly CollectionEntry<'blog'>[]) {
  const published = posts
    .filter(isPublished)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return {
    featuredPost: published[0],
    archivePosts: published.slice(1),
  };
}
