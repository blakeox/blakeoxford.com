import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export const GET = () =>
  rss({
    title: 'Blake Oxford Blog',
    description: 'RSS feed for Blake Oxford’s blog',
    site: 'https://blakeoxford.com', // Update to your deployed site URL
    items: pagesGlobToRssItems(import.meta.glob('./blog/*.mdx')),
  });
