import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { loadProjectEnv } from './src/lib/env.ts';
import { createDevSemanticSearchProxy } from './src/integrations/dev-semantic-search-proxy.ts';
import { createDevAISearchProxy } from './src/integrations/dev-ai-proxy.ts';

loadProjectEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Lazy-load Sentry only for real production builds, not Astro utility commands. */
const sentryIntegrations = [];
const isAstroUtilityCommand = process.argv.some(
  (arg) =>
    arg === 'check' ||
    arg === 'sync' ||
    arg.endsWith('/check') ||
    arg.endsWith('\\check') ||
    arg.endsWith('/sync') ||
    arg.endsWith('\\sync')
);
if (
  process.env.NODE_ENV === 'production' &&
  process.env.PUBLIC_SENTRY_DSN &&
  !isAstroUtilityCommand
) {
  try {
    const { default: sentry } = await import('@sentry/astro');
    sentryIntegrations.push(
      sentry({
        telemetry: false,
        sourcemaps: {
          disable: !process.env.SENTRY_AUTH_TOKEN,
        },
        ...(process.env.SENTRY_AUTH_TOKEN
          ? {
              authToken: process.env.SENTRY_AUTH_TOKEN,
              project: process.env.SENTRY_PROJECT || 'blakeoxford-browser',
              org: process.env.SENTRY_ORG || 'your-sentry-org',
            }
          : {}),
      })
    );
  } catch (error) {
    console.warn(
      '[astro.config] Skipping Sentry integration:',
      error instanceof Error ? error.message : error
    );
  }
}

export default defineConfig({
  output: 'static',
  envPrefix: 'PUBLIC_',
  site: 'https://blakeoxford.com',
  integrations: [
    react(),
    mdx(),
    sitemap(),
    ...sentryIntegrations,
    ...(process.env.ENABLE_ASTRO_COMPRESS === 'true' ? [compress()] : []),
  ],
  image: {
    domains: ['blakeoxford.com'],
    formats: ['avif', 'webp', 'jpeg'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blakeoxford.com',
      },
    ],
  },
  vite: {
    plugins: [
      tailwindcss(),
      ...(process.env.NODE_ENV === 'production'
        ? []
        : [createDevSemanticSearchProxy(), createDevAISearchProxy()]),
    ],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                /node_modules\/(?:react|react-dom|scheduler)\//.test(id) ||
                /node_modules\/\.pnpm\/(?:react|react-dom|scheduler)@/.test(id)
              ) {
                return 'vendor-react';
              }
              if (id.includes('@sentry') || id.includes('sentry')) {
                return 'vendor-sentry';
              }
              return 'vendor';
            }
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
  },
});
