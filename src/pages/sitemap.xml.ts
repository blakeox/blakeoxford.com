import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

type SitemapEntry = {
  loc: string;
  changefreq: string;
  priority: number;
};

export async function GET() {
  const site = 'https://blakeoxford.com';
  const staticUrls: SitemapEntry[] = [
    { loc: '/', changefreq: 'weekly', priority: 1.0 },
    { loc: '/about/', changefreq: 'monthly', priority: 0.8 },
    { loc: '/blog/', changefreq: 'weekly', priority: 0.9 },
    { loc: '/projects/', changefreq: 'monthly', priority: 0.7 },
    { loc: '/contact/', changefreq: 'yearly', priority: 0.5 },
  ];

  // Individual project pages (since they're now Astro pages, not MDX)
  const projectPages: SitemapEntry[] = [
    { loc: '/projects/adp-workforcenow/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/advancedmd-implementation/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/bank-projections-modeling/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/ferment-app/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/google-workspace-migration/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/LLM-note-coaching/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/Microsoft-Fabric/', changefreq: 'monthly', priority: 0.6 },
  ];

  // Individual blog post pages from content collection
  const blogEntries = await getCollection('blog', (entry: CollectionEntry<'blog'>) => !entry.data.draft);
  const blogPages: SitemapEntry[] = blogEntries.map((post: CollectionEntry<'blog'>) => ({
    loc: `/blog/${post.slug}/`,
    changefreq: 'monthly',
    priority: 0.7,
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
      (u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
