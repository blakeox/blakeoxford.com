import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import sentry from '@sentry/astro';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

function loadEnvFile(filename) {
  const absolutePath = resolve(process.cwd(), filename);
  if (!existsSync(absolutePath)) return;
  const contents = readFileSync(absolutePath, 'utf-8');
  for (const line of contents.split('\n')) {
    if (!line || line.trim().startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    if (!key) continue;
    const rawValue = line.slice(index + 1).trim();
    const unquoted = rawValue.replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = unquoted;
    }
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

function createDevAISearchProxy() {
  return {
    name: 'ai-search-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/ai-search')) {
          next();
          return;
        }

        const origin = req.headers.origin ?? '*';
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
        res.setHeader('Vary', 'Origin');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const endpoint = process.env.AI_SEARCH_API_ENDPOINT;
        const token = process.env.AI_SEARCH_API_TOKEN;

        if (!endpoint || !token) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'AI search service not configured' }));
          return;
        }

        let rawBody = '';
        try {
          for await (const chunk of req) {
            rawBody += chunk;
          }
        } catch (error) {
          console.error('Failed to read AI search request body', error);
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Invalid request body' }));
          return;
        }

        let payload;
        try {
          payload = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          return;
        }

        const query = typeof payload?.query === 'string'
          ? payload.query.trim()
          : typeof payload?.prompt === 'string'
            ? payload.prompt.trim()
            : typeof payload?.question === 'string'
              ? payload.question.trim()
              : '';

        if (!query) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Query is required' }));
          return;
        }

        const history = Array.isArray(payload?.history)
          ? payload.history
              .filter((entry) => entry && typeof entry === 'object' && typeof entry.role === 'string' && typeof entry.content === 'string')
              .slice(-10)
          : [];

        try {
          if (typeof globalThis.fetch !== 'function') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Fetch API is not available in this environment' }));
            return;
          }

          const upstreamResponse = await globalThis.fetch(endpoint, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ query, history })
          });

          if (!upstreamResponse.ok) {
            let errorDetail = 'Upstream service error';
            try {
              const upstreamError = await upstreamResponse.json();
              if (typeof upstreamError?.error === 'string') {
                errorDetail = upstreamError.error;
              } else if (Array.isArray(upstreamError?.errors) && upstreamError.errors[0]?.message) {
                errorDetail = upstreamError.errors[0].message;
              }
            } catch {
              const upstreamText = await upstreamResponse.text();
              if (upstreamText) errorDetail = upstreamText.slice(0, 200);
            }

            res.statusCode = upstreamResponse.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: errorDetail }));
            return;
          }

          let upstreamData;
          try {
            upstreamData = await upstreamResponse.json();
          } catch {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Invalid response from AI service' }));
            return;
          }

          if (upstreamData && typeof upstreamData === 'object' && upstreamData.success === false) {
            const upstreamError = typeof upstreamData?.errors?.[0]?.message === 'string' ? upstreamData.errors[0].message : 'AI search service reported an error';
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: upstreamError }));
            return;
          }

          const result = upstreamData?.result && typeof upstreamData.result === 'object' ? upstreamData.result : upstreamData;
          const message = typeof result?.response === 'string'
            ? result.response.trim()
            : typeof upstreamData?.response === 'string'
              ? upstreamData.response.trim()
              : '';

          if (!message) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'AI service returned no message' }));
            return;
          }

          const sources = Array.isArray(result?.data)
            ? result.data
                .map((entry, index) => {
                  if (!entry || typeof entry !== 'object') return null;
                  const attributes = entry.attributes && typeof entry.attributes === 'object' ? entry.attributes : {};
                  const fileMeta = attributes.file && typeof attributes.file === 'object' ? attributes.file : {};
                  const rawUrl = typeof entry.filename === 'string' && entry.filename
                    ? entry.filename
                    : typeof attributes.folder === 'string'
                      ? attributes.folder
                      : '';
                  if (!rawUrl) return null;
                  const titleCandidate = typeof fileMeta.title === 'string' && fileMeta.title.trim()
                    ? fileMeta.title.trim()
                    : typeof attributes.folder === 'string' && attributes.folder.trim()
                      ? attributes.folder.trim()
                      : `Source ${index + 1}`;
                  let snippet;
                  if (Array.isArray(entry.content)) {
                    const contentItem = entry.content.find((item) => item && typeof item === 'object' && typeof item.text === 'string' && item.text.trim());
                    if (contentItem && typeof contentItem.text === 'string') {
                      snippet = contentItem.text.trim().slice(0, 320);
                    }
                  }
                  const score = typeof entry.score === 'number' ? entry.score : undefined;
                  const sourcePayload = {
                    title: titleCandidate,
                    url: rawUrl,
                  };
                  if (snippet) {
                    sourcePayload.snippet = snippet;
                  }
                  if (typeof score === 'number') {
                    sourcePayload.score = score;
                  }
                  return sourcePayload;
                })
                .filter(Boolean)
            : [];

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ message, sources }));
        } catch (error) {
          console.error('AI search proxy failed', error);
          res.statusCode = 504;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'AI search request failed' }));
        }
      });
    }
  };
}

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
        telemetry: false,
        sourcemaps: {
          disable: !process.env.SENTRY_AUTH_TOKEN,
        },
        ...(process.env.SENTRY_AUTH_TOKEN ? {
          authToken: process.env.SENTRY_AUTH_TOKEN,
          project: process.env.SENTRY_PROJECT || 'blakeoxford-browser',
          org: process.env.SENTRY_ORG || 'your-sentry-org',
        } : {}),
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
    plugins: process.env.NODE_ENV === 'production' ? [] : [createDevAISearchProxy()],
    build: {
      // Use Lightning CSS for minification; it's more tolerant of modern selectors
      // and avoids false-positive errors like &:is(role="button") during minify.
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split vendor into smaller chunks for better caching
            if (id.includes('node_modules')) {
              // React and React DOM - frequently updated, separate chunk
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // Large libraries - separate chunk
              if (id.includes('@sentry') || id.includes('sentry')) {
                return 'vendor-sentry';
              }
              // Everything else
              return 'vendor';
            }
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
