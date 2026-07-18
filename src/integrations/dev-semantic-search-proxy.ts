import type { Plugin } from 'vite';
import { sendErrorResponse, setCORSHeaders } from '../lib/dev-proxy/response-helpers';

/**
 * Dev-only Vite middleware: proxy `/api/semantic-search` to production (or SEMANTIC_SEARCH_PROXY_URL).
 */
export function createDevSemanticSearchProxy(): Plugin {
  const targetBase = process.env.SEMANTIC_SEARCH_PROXY_URL ?? 'https://blakeoxford.com';

  return {
    name: 'semantic-search-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/semantic-search')) {
          next();
          return;
        }

        setCORSHeaders(res, req.headers.origin);
        res.setHeader('Access-Control-Allow-Headers', 'content-type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          sendErrorResponse(res, 405, 'Method not allowed');
          return;
        }

        let rawBody = '';
        try {
          for await (const chunk of req) {
            rawBody += chunk;
          }
        } catch (error) {
          console.error('Failed to read semantic search request body', error);
          sendErrorResponse(res, 400, 'Invalid request body');
          return;
        }

        try {
          const upstreamResponse = await globalThis.fetch(`${targetBase}/api/semantic-search`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: rawBody,
          });

          const responseBody = await upstreamResponse.text();
          res.statusCode = upstreamResponse.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(responseBody);
        } catch (error) {
          console.error('Semantic search proxy failed', error);
          sendErrorResponse(res, 504, 'Semantic search request failed');
        }
      });
    },
  };
}
