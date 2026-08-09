import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { isPublished } from '@/lib/content/publication-contract.mjs';

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

export async function GET() {
  const site = 'https://blakeoxford.com';
  const staticUrls: SitemapEntry[] = [
    { loc: '/' },
    { loc: '/about/' },
    { loc: '/blog/' },
    { loc: '/projects/' },
    { loc: '/contact/' },
  ];

  // Individual project pages - dynamically load from content collection
  const projectEntries = await getCollection('projects', (entry: CollectionEntry<'projects'>) =>
    isPublished(entry)
  );
  const projectPages: SitemapEntry[] = projectEntries.map(
    (project: CollectionEntry<'projects'>) => ({
      loc: `/projects/${project.id}/`,
      ...(project.data.updatedDate
        ? { lastmod: new Date(project.data.updatedDate).toISOString() }
        : {}),
    })
  );

  // Individual blog post pages from content collection
  const blogEntries = await getCollection('blog', (entry: CollectionEntry<'blog'>) =>
    isPublished(entry)
  );
  const blogPages: SitemapEntry[] = blogEntries.map((post: CollectionEntry<'blog'>) => ({
    loc: `/blog/${post.id}/`,
    lastmod: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
  }));

  const urls = [
    ...staticUrls.map((u: SitemapEntry) => ({
      ...u,
      loc: site + u.loc,
    })),
    ...projectPages.map((u: SitemapEntry) => ({
      ...u,
      loc: site + u.loc,
    })),
    ...blogPages.map((u: SitemapEntry) => ({
      ...u,
      loc: site + u.loc,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n  </url>`
    )
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
