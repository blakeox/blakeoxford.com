 
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function GET(context: APIContext) {
  const blogEntries = await getCollection('blog', (entry: CollectionEntry<'blog'>) => !entry.data.draft);
  const blog = blogEntries
    .slice()
    .sort((a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'Blake Oxford - Blog',
    description: 'Blake Oxford\'s thoughts on technology, consulting, and digital transformation',
    site: context.site!,
    items: blog.map((post: CollectionEntry<'blog'>) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
