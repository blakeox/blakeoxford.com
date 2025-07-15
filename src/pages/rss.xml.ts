/* eslint-disable @typescript-eslint/no-explicit-any */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blog = await getCollection('blog') as any[];
  
  return rss({
    title: 'Blake Oxford - Blog',
    description: 'Blake Oxford\'s thoughts on technology, consulting, and digital transformation',
    site: context.site!,
    items: blog.map((post: any) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
