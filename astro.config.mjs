import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';

export default defineConfig({
  adapter: cloudflare(),
  integrations: [
    mdx(),
    sitemap(),
    compress(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});