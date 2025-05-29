import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',             // Fully static output
  envPrefix: 'PUBLIC_',
  site: 'https://blakeoxford.com',
  integrations: [
    mdx(),
    sitemap(),
    compress(),
    react({ ssr: false }),      // No SSR
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});