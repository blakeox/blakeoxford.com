/**
 * Cloudflare Worker entry: route dispatch, canonicalization, asset fallback.
 */
import { initEdgeSentry } from '../sentry.edge.config.js';
import type { Env } from './types';
import { isBlakeOxfordHostname } from './shared/hostname';
import { generateRequestId } from './shared/request-id';
import type { RouteContext } from './shared/route-context';
import { handleRobotsFavicon } from './routes/robots-favicon';
import { handleHealth } from './routes/health';
import { handleEmail } from './routes/email';
import { handleAiSearch } from './routes/ai-search';
import { handleConversation } from './routes/conversation';
import { handleSemanticSearch } from './routes/semantic-search';
import { handleAiFeedback } from './routes/ai-feedback';
import { handleTheme } from './routes/theme';
import { handleLegacySearchRedirect } from './routes/legacy-search-redirect';
import { handleAssets } from './routes/assets';

export { ConversationDurableObject } from './ConversationDO.ts';

const WorkerApp = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const Sentry = initEdgeSentry(env);
    const url = new URL(request.url);

    if (url.pathname.startsWith('/cdn-cgi/')) {
      return fetch(request);
    }

    const method = request.method || 'GET';
    const reqId = generateRequestId(request);

    // HTTPS + apex canonicalization
    try {
      const host = url.hostname;
      const isGetLike = request.method === 'GET' || request.method === 'HEAD';
      const isProdDomain = isBlakeOxfordHostname(host);
      if (isProdDomain && url.protocol === 'http:' && isGetLike) {
        url.protocol = 'https:';
        const r = Response.redirect(url.toString(), 308);
        const h = new Headers(r.headers);
        h.set('x-request-id', reqId);
        h.set('x-route-kind', 'redirect');
        h.set('x-cache-policy', 'no-store');
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
      }
      if (isProdDomain && host.startsWith('www.') && isGetLike) {
        url.hostname = host.replace(/^www\./, '');
        const r = Response.redirect(url.toString(), 308);
        const h = new Headers(r.headers);
        h.set('x-request-id', reqId);
        h.set('x-route-kind', 'redirect');
        h.set('x-cache-policy', 'no-store');
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
      }
    } catch {
      // ignore canonicalization errors
    }

    const routeCtx: RouteContext = { request, env, ctx, url, reqId, method, Sentry };

    const handlers = [
      handleLegacySearchRedirect,
      handleRobotsFavicon,
      handleHealth,
      handleEmail,
      handleAiSearch,
      handleConversation,
      handleSemanticSearch,
      handleAiFeedback,
      handleTheme,
    ] as const;

    for (const handler of handlers) {
      const response = await handler(routeCtx);
      if (response) return response;
    }

    return handleAssets(routeCtx);
  },
};

export default WorkerApp;
