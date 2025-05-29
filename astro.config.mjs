import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare'; // ✅ NOT '/ssr'
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',         // ✅ Static mode — pre-renders everything
  adapter: cloudflare(),    // ✅ Static Cloudflare Pages output
  envPrefix: 'PUBLIC_',
  site: 'https://blakeoxford.com',
  integrations: [
    mdx(),
    sitemap(),
    compress(),
    react({ ssr: false }),   // ✅ Disables any server-side React rendering
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});