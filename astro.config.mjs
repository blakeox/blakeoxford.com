import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  envPrefix: 'PUBLIC_',
  site: 'https://blakeoxford.com',      // ← your real domain
  adapter: cloudflare(),                // ← enable for Cloudflare deployment
  integrations: [
    mdx(),
    sitemap(),
    compress(),
    react(),                           // React support for .jsx islands
  ],
  vite: {
    plugins: [
      tailwindcss(),                   // Tailwind 4 via Vite plugin
    ],
  },
});