import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import sentry from '@sentry/astro';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  output: 'static',
  envPrefix: 'PUBLIC_',
  site: 'https://blakeoxford.com',
  integrations: [
    react(),
    mdx(),
    sitemap(),
    // Sentry error tracking (production only to avoid noise in development)
    ...(process.env.NODE_ENV === 'production' && process.env.PUBLIC_SENTRY_DSN ? [
      sentry({
        dsn: process.env.PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.PUBLIC_GIT_COMMIT || 'dev',
        // Source maps upload (optional - requires SENTRY_AUTH_TOKEN)
        sourceMapsUploadOptions: process.env.SENTRY_AUTH_TOKEN ? {
          project: process.env.SENTRY_PROJECT || 'blakeoxford-browser',
          org: process.env.SENTRY_ORG || 'your-sentry-org',
          authToken: process.env.SENTRY_AUTH_TOKEN,
        } : undefined,
      })
    ] : []),
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
      // Use Lightning CSS for minification; it's more tolerant of modern selectors
      // and avoids false-positive errors like &:is(role="button") during minify.
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) return 'vendor';
            return undefined;
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      },
      // Ensure a single React instance across SSR and client builds
      // to avoid "Invalid hook call" errors caused by duplicate React copies
      dedupe: ['react', 'react-dom']
    }
  },
});