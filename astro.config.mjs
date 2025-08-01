import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  output: 'static',
  envPrefix: 'PUBLIC_',
  site: 'https://blakeoxford.com',
  integrations: [
    mdx(),
    sitemap(),
    compress(),
    react(),
  ],
  image: {
    // Enhanced image optimization
    domains: ['blakeoxford.com'],
    formats: ['avif', 'webp', 'jpeg'],
    remotePatterns: [{
      protocol: 'https',
      hostname: '**.blakeoxford.com'
    }]
  },
  vite: {
    build: {
      minify: true,
    },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    }
  },
});