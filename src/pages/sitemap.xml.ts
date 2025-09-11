export async function GET() {
  const site = 'https://blakeoxford.com';
  const staticUrls = [
    { loc: '/', changefreq: 'weekly', priority: 1.0 },
    { loc: '/about/', changefreq: 'monthly', priority: 0.8 },
    { loc: '/blog', changefreq: 'weekly', priority: 0.9 },
    { loc: '/projects', changefreq: 'monthly', priority: 0.7 },
    { loc: '/contact/', changefreq: 'yearly', priority: 0.5 },
  ];

  // Individual project pages (since they're now Astro pages, not MDX)
  const projectPages = [
    { loc: '/projects/adp-workforcenow/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/advancedmd-implementation/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/bank-projections-modeling/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/ferment-app/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/google-workspace-migration/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/LLM-note-coaching/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/projects/Microsoft-Fabric/', changefreq: 'monthly', priority: 0.6 },
  ];

  // Individual blog post pages (since they're now Astro pages, not MDX)
  const blogPages = [
    { loc: '/blog/hello-world/', changefreq: 'monthly', priority: 0.7 },
  ];

  const urls = [
    ...staticUrls.map((u) => ({
      ...u,
      loc: site + u.loc,
    })),
    ...projectPages.map((u) => ({
      ...u,
      loc: site + u.loc,
    })),
    ...blogPages.map((u) => ({
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
