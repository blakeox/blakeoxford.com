import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  envPrefix: 'PUBLIC_',
  site: 'https://blakeoxford.com',
  adapter: cloudflare(),
  integrations: [
    mdx(),
    sitemap(),
    compress(),
    react({ ssr: false }), // ← disables React SSR to prevent MessageChannel error
  ],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});