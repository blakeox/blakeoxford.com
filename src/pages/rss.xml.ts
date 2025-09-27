 
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function GET(context: APIContext) {
  const blog = (await getCollection('blog', ({ data }) => !data.draft))
    .slice()
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'Blake Oxford - Blog',
    description: 'Blake Oxford\'s thoughts on technology, consulting, and digital transformation',
    site: context.site!,
    items: blog.map((post: CollectionEntry<'blog'>) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
