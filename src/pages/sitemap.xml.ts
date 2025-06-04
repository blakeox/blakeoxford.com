import { getCollection } from 'astro:content';

export async function GET() {
  const site = 'https://blakeoxford.com';
  const staticUrls = [
    { loc: '/', changefreq: 'weekly', priority: 1.0 },
    { loc: '/about/', changefreq: 'monthly', priority: 0.8 },
    { loc: '/blog', changefreq: 'weekly', priority: 0.9 },
    { loc: '/projects', changefreq: 'monthly', priority: 0.7 },
    { loc: '/contact/', changefreq: 'yearly', priority: 0.5 },
  ];

  type BlogPost = { slug: string; data: { draft?: boolean } };
  type Project = { slug: string; data: { draft?: boolean } };
  const blogPosts = (await getCollection('blog')) as BlogPost[];
  const publishedBlogPosts = blogPosts.filter((post) => !post.data.draft);
  const projectPosts = (await getCollection('projects')) as Project[];
  const publishedProjects = projectPosts.filter((project) => !project.data.draft);

  const urls = [
    ...staticUrls.map((u) => ({
      ...u,
      loc: site + u.loc,
    })),
    ...publishedBlogPosts.map((post) => ({
      loc: `${site}/blog/${post.slug}`,
      changefreq: 'monthly',
      priority: 0.7,
    })),
    ...publishedProjects.map((project) => ({
      loc: `${site}/projects/${project.slug}`,
      changefreq: 'monthly',
      priority: 0.6,
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
