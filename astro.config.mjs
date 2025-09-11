import { defineConfig } from 'astro/config';
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
  // Gate astro-compress to avoid long hooks in CI builds
  // Enable only when explicitly requested via env
  ...(process.env.ENABLE_ASTRO_COMPRESS === 'true' ? [compress()] : []),
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
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Put all node_modules into a single vendor chunk
            if (id.includes('node_modules')) return 'vendor';
            return undefined;
          }
        }
      }
    },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    }
  },
});