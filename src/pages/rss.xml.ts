 
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  // Define blog posts data manually since we're no longer using MDX content
  const blog = [
    {
      slug: 'hello-world',
      data: {
        title: 'Hello World',
        description: 'My first blog post using Astro Content Collections and MDX.',
        pubDate: new Date('2025-05-19'),
        draft: false
      }
    }
  ];
  
  return rss({
    title: 'Blake Oxford - Blog',
    description: 'Blake Oxford\'s thoughts on technology, consulting, and digital transformation',
    site: context.site!,
    items: blog.map((post: any) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
