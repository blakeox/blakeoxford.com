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
import { handleLegacyProjectRedirect } from './routes/legacy-project-redirect';
import { handleDebug } from './routes/debug';
import { handleAssets } from './routes/assets';
import { runAiSearchCanary } from './scheduled/ai-search-canary';

export { ConversationDurableObject } from './ConversationDO.ts';

const CONTENT_SECURITY_POLICY =
  "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://www.clarity.ms https://static.cloudflareinsights.com https://cdn-cgi/ https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; font-src 'self' data:; connect-src 'self' https://www.clarity.ms https://*.clarity.ms https://challenges.cloudflare.com https://static.cloudflareinsights.com; frame-src https://challenges.cloudflare.com; worker-src 'self'; manifest-src 'self'";

export function shouldNoindexQueryResponse(url: URL, contentType: string): boolean {
  return url.search.length > 0 && contentType.toLowerCase().includes('text/html');
}

export function applySecurityHeaders(
  response: Response,
  reqId: string,
  hostname: string,
  requestUrl?: URL
): Response {
  if (response.status === 101) return response;

  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'SAMEORIGIN');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set(
    'permissions-policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  headers.set('x-request-id', headers.get('x-request-id') || reqId);

  if (isBlakeOxfordHostname(hostname)) {
    headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
  }

  const contentType = headers.get('content-type') || '';
  if (contentType.includes('text/html') && !headers.has('content-security-policy')) {
    headers.set('content-security-policy', CONTENT_SECURITY_POLICY);
  }
  if (requestUrl && shouldNoindexQueryResponse(requestUrl, contentType)) {
    headers.set('x-robots-tag', 'noindex, nofollow');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function isProductionScheduledPath(pathname: string, environment?: string): boolean {
  return environment === 'production' && pathname === '/__scheduled';
}

const CANONICAL_SLASH_ROUTE_PREFIXES = [
  '/about',
  '/blog',
  '/contact',
  '/projects',
  '/accessibility',
  '/components',
  '/design',
  '/docs',
] as const;

export function canonicalSlashPath(pathname: string): string | null {
  if (
    pathname === '/' ||
    pathname.endsWith('/') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/')
  ) {
    return null;
  }

  return CANONICAL_SLASH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
    ? `${pathname}/`
    : null;
}

export function canonicalRequestUrl(requestUrl: URL): URL | null {
  const target = new URL(requestUrl);
  const isProdDomain = isBlakeOxfordHostname(target.hostname);
  let changed = false;

  if (isProdDomain && target.protocol === 'http:') {
    target.protocol = 'https:';
    changed = true;
  }
  if (isProdDomain && target.hostname.startsWith('www.')) {
    target.hostname = target.hostname.replace(/^www\./, '');
    changed = true;
  }

  const slashPath = canonicalSlashPath(target.pathname);
  if (slashPath) {
    target.pathname = slashPath;
    changed = true;
  }

  return changed ? target : null;
}

const WorkerApp = {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const Sentry = initEdgeSentry(env);
    try {
      await runAiSearchCanary(env, controller.scheduledTime);
    } catch (error) {
      controller.noRetry();
      Sentry.captureException(error, {
        tags: { runtime: 'scheduled', check: 'ai-search-canary' },
      });
      console.error('AI Search scheduled canary failed', error);
      throw error;
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const Sentry = initEdgeSentry(env);
    const url = new URL(request.url);

    if (url.pathname.startsWith('/cdn-cgi/')) {
      return fetch(request);
    }

    const method = request.method || 'GET';
    const reqId = generateRequestId(request);

    if (isProductionScheduledPath(url.pathname, env.ENVIRONMENT)) {
      return applySecurityHeaders(
        new Response('Not Found', {
          status: 404,
          headers: { 'cache-control': 'no-store', 'x-route-kind': 'blocked-internal' },
        }),
        reqId,
        url.hostname,
        url
      );
    }

    const isGetLike = request.method === 'GET' || request.method === 'HEAD';
    const canonicalUrl = isGetLike ? canonicalRequestUrl(url) : null;
    if (canonicalUrl) {
      const redirect = Response.redirect(canonicalUrl.toString(), 308);
      const headers = new Headers(redirect.headers);
      headers.set('x-request-id', reqId);
      headers.set('x-route-kind', 'redirect');
      headers.set('x-cache-policy', 'no-store');
      return applySecurityHeaders(
        new Response(redirect.body, {
          status: redirect.status,
          statusText: redirect.statusText,
          headers,
        }),
        reqId,
        url.hostname,
        url
      );
    }

    const routeCtx: RouteContext = { request, env, ctx, url, reqId, method, Sentry };

    const handlers = [
      handleLegacyProjectRedirect,
      handleLegacySearchRedirect,
      handleRobotsFavicon,
      handleHealth,
      handleEmail,
      handleAiSearch,
      handleConversation,
      handleSemanticSearch,
      handleAiFeedback,
      handleTheme,
      handleDebug,
    ] as const;

    for (const handler of handlers) {
      const response = await handler(routeCtx);
      if (response) return applySecurityHeaders(response, reqId, url.hostname, url);
    }

    return applySecurityHeaders(await handleAssets(routeCtx), reqId, url.hostname, url);
  },
};

export default WorkerApp;
