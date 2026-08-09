import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { isPublished } from '@/lib/content/publication-contract.mjs';

function escapeXml(value: string): string {
  return value.replace(
    /[<>&'"]/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character] ?? character
  );
}

export async function GET(context: APIContext) {
  const blogEntries = await getCollection('blog', (entry: CollectionEntry<'blog'>) =>
    isPublished(entry)
  );
  const blog = blogEntries
    .slice()
    .sort(
      (a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) =>
        b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
    );

  return rss({
    title: 'Blake Oxford - Blog',
    description: "Blake Oxford's thoughts on technology, consulting, and digital transformation",
    site: context.site!,
    items: blog.map((post: CollectionEntry<'blog'>) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      customData: `<dc:creator>${escapeXml(post.data.author)}</dc:creator>${
        post.data.updatedDate ? `<dc:date>${post.data.updatedDate.toISOString()}</dc:date>` : ''
      }`,
    })),
    xmlns: { dc: 'http://purl.org/dc/elements/1.1/' },
    customData: '<language>en-us</language>',
  });
}
