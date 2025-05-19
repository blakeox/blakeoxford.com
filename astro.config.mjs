import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rss from '@astrojs/rss';
import compress from 'astro-compress';

export default defineConfig({
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    mdx(),
    sitemap(),
    rss(),
    compress(),
  ],
});