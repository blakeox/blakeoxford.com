import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { isPublished } from '@/lib/content/publication-contract.mjs';

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

export async function GET() {
  const site = 'https://blakeoxford.com';

  const projectEntries = await getCollection('projects', (entry: CollectionEntry<'projects'>) =>
    isPublished(entry)
  );
  const blogEntries = await getCollection('blog', (entry: CollectionEntry<'blog'>) =>
    isPublished(entry)
  );

  const latestBlogMod = blogEntries.reduce((latest: number, post: CollectionEntry<'blog'>) => {
    const stamp = (post.data.updatedDate ?? post.data.pubDate).getTime();
    return stamp > latest ? stamp : latest;
  }, 0);

  const latestProjectMod = projectEntries.reduce(
    (latest: number, project: CollectionEntry<'projects'>) => {
      const raw = project.data.updatedDate ?? project.data.date;
      if (!raw) return latest;
      const stamp = new Date(raw).getTime();
      return stamp > latest ? stamp : latest;
    },
    0
  );

  const staticUrls: SitemapEntry[] = [
    { loc: '/' },
    { loc: '/about/' },
    { loc: '/contact/' },
    ...(latestBlogMod
      ? [{ loc: '/blog/', lastmod: new Date(latestBlogMod).toISOString() }]
      : [{ loc: '/blog/' }]),
    ...(latestProjectMod
      ? [{ loc: '/projects/', lastmod: new Date(latestProjectMod).toISOString() }]
      : [{ loc: '/projects/' }]),
  ];

  const projectPages: SitemapEntry[] = projectEntries.map(
    (project: CollectionEntry<'projects'>) => ({
      loc: `/projects/${project.id}/`,
      ...(project.data.updatedDate
        ? { lastmod: new Date(project.data.updatedDate).toISOString() }
        : {}),
    })
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
