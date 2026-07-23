import {
  extractErrorDetail,
  extractMessage,
  parseQueryPayload,
  parseSources,
} from '@/lib/dev-proxy/payload-parser.js';
import {
  sendErrorResponse,
  sendSuccessResponse,
  setCORSHeaders,
} from '@/lib/dev-proxy/response-helpers.js';

type ConnectNext = (error?: unknown) => void;

type ConnectReq = {
  url?: string;
  method?: string;
  headers: { origin?: string };
  [Symbol.asyncIterator](): AsyncIterator<string | Buffer>;
};

type ConnectRes = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (data?: string) => void;
};

type ViteDevServer = {
  middlewares: {
    use: (
      handler: (req: ConnectReq, res: ConnectRes, next: ConnectNext) => void | Promise<void>
    ) => void;
  };
};

type VitePlugin = {
  name: string;
  configureServer: (server: ViteDevServer) => void;
};

/**
 * Dev-only Vite middleware: proxy `/api/ai-search` to AI_SEARCH_API_ENDPOINT.
 */
export function createDevAISearchProxy(): VitePlugin {
  return {
    name: 'ai-search-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/ai-search')) {
          next();
          return;
        }

        setCORSHeaders(res, req.headers.origin);

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          sendErrorResponse(res, 405, 'Method not allowed');
          return;
        }

        const endpoint = process.env.AI_SEARCH_API_ENDPOINT;
        const token = process.env.AI_SEARCH_API_TOKEN;

        if (!endpoint || !token) {
          sendErrorResponse(res, 503, 'AI search service not configured');
          return;
        }

        let rawBody = '';
        try {
          for await (const chunk of req) {
            rawBody += chunk;
          }
        } catch (error) {
          console.error('Failed to read AI search request body', error);
          sendErrorResponse(res, 400, 'Invalid request body');
          return;
        }

        let payload: unknown;
        try {
          payload = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          sendErrorResponse(res, 400, 'Invalid JSON payload');
          return;
        }

        const { query, history } = parseQueryPayload(payload);
        if (!query) {
          sendErrorResponse(res, 400, 'Query is required');
          return;
        }

        try {
          if (typeof globalThis.fetch !== 'function') {
            sendErrorResponse(res, 500, 'Fetch API is not available in this environment');
            return;
          }

          const upstreamResponse = await globalThis.fetch(endpoint, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query, history }),
          });

          if (!upstreamResponse.ok) {
            let errorDetail = 'Upstream service error';
            try {
              const upstreamError = await upstreamResponse.json();
              errorDetail = extractErrorDetail(upstreamError);
            } catch {
              const upstreamText = await upstreamResponse.text();
              if (upstreamText) errorDetail = upstreamText.slice(0, 200);
            }

            sendErrorResponse(res, upstreamResponse.status, errorDetail);
            return;
          }

          let upstreamData: unknown;
          try {
            upstreamData = await upstreamResponse.json();
          } catch {
            sendErrorResponse(res, 502, 'Invalid response from AI service');
            return;
          }

          if (
            upstreamData &&
            typeof upstreamData === 'object' &&
            (upstreamData as { success?: boolean }).success === false
          ) {
            sendErrorResponse(res, 502, extractErrorDetail(upstreamData));
            return;
          }

          const message = extractMessage(upstreamData);
          if (!message) {
            sendErrorResponse(res, 502, 'AI service returned no message');
            return;
          }

          const sources = parseSources(upstreamData);
          sendSuccessResponse(res, { message, sources });
        } catch (error) {
          console.error('AI search proxy failed', error);
          sendErrorResponse(res, 504, 'AI search request failed');
        }
      });
    },
  };
}
