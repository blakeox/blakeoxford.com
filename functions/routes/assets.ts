import { CACHE_DURATIONS, isHashedPath } from '../../src/config/constants.ts';
import { addEdgeBreadcrumb } from '../../sentry.edge.config.js';
import { EdgeCacheManager } from '../shared/cache';
import { buildOfflineHtml } from '../shared/offline-html';
import type { RouteContext } from '../shared/route-context';

/** Asset remaps, ASSETS fetch, caching, theme personalization, error fallbacks. Always handles. */
export async function handleAssets({
  request,
  env,
  ctx,
  url,
  reqId,
  method,
  Sentry,
}: RouteContext): Promise<Response> {
  // Image path remaps
  if (url.pathname === '/assets/images/optimized/avif/china-profile-picture@640w.avif') {
    try {
      const img320 = new URL(
        '/assets/images/optimized/avif/china-profile-picture@320w.avif',
        url.origin
      );
      const imgReq = new Request(img320.toString(), request);
      const imgRes = await env.ASSETS.fetch(imgReq);
      if (imgRes.ok) {
        const headers = new Headers(imgRes.headers);
        headers.set('content-type', 'image/avif');
        headers.set('cache-control', 'public, max-age=31536000, immutable');
        headers.set('x-request-id', reqId);
        headers.set('x-route-kind', 'asset');
        headers.set('x-cache-policy', headers.get('cache-control') || '');
        return new Response(imgRes.body, { status: 200, headers });
      }
    } catch {
      // ignore remap failure; fall through
    }
  }
  if (url.pathname === '/assets/images/optimized/avif/china-profile-picture@320w.avif') {
    try {
      const base = new URL('/assets/images/optimized/avif/china-profile-picture.avif', url.origin);
      const baseReq = new Request(base.toString(), request);
      const baseRes = await env.ASSETS.fetch(baseReq);
      if (baseRes.ok) {
        const headers = new Headers(baseRes.headers);
        headers.set('content-type', 'image/avif');
        headers.set('cache-control', 'public, max-age=31536000, immutable');
        headers.set('x-request-id', reqId);
        headers.set('x-route-kind', 'asset');
        headers.set('x-cache-policy', headers.get('cache-control') || '');
        return new Response(baseRes.body, { status: 200, headers });
      }
    } catch {
      // ignore remap failure; fall through
    }
  }

  // Serve from ASSETS
  const cacheManager = new EdgeCacheManager(request, env);
  const cacheStrategy = cacheManager.getCacheStrategy();
  const themeCookie = request.headers.get('cookie')?.match(/(^|;\s*)theme=([^;]+)/)?.[2];
  const personalizedThemeRequest = Boolean(themeCookie && themeCookie !== 'system');

  if (method === 'GET' && !personalizedThemeRequest) {
    const cacheResponse = await caches.default.match(request, { ignoreMethod: false });
    if (cacheResponse) return cacheResponse;
  }

  try {
    const startTs = Date.now();
    console.log(
      '\u27a1\ufe0f Request start',
      JSON.stringify({ id: reqId, method, path: url.pathname })
    );

    // Add breadcrumb for request tracking
    addEdgeBreadcrumb({
      category: 'http',
      message: `${method} ${url.pathname}`,
      level: 'info',
      data: { reqId, method, path: url.pathname },
    });

    let originResponse = await env.ASSETS.fetch(request);

    if (
      originResponse.status === 404 &&
      !url.pathname.includes('.') &&
      !url.pathname.endsWith('/index.html')
    ) {
      const altUrl = new URL(url);
      altUrl.pathname = url.pathname.replace(/\/$/, '') + '/index.html';
      originResponse = await env.ASSETS.fetch(new Request(altUrl.toString(), request));
    }

    if (!originResponse.ok) {
      if (originResponse.status >= 500) {
        const cached = await caches.default.match(request);
        if (cached) return cached;
        if (url.pathname.startsWith('/api/')) {
          const headers = new Headers(originResponse.headers);
          headers.set(
            'content-type',
            headers.get('content-type') || 'application/json; charset=utf-8'
          );
          headers.set('cache-control', 'no-store');
          headers.set('x-request-id', reqId);
          headers.set('x-route-kind', 'api');
          headers.set('x-cache-policy', 'no-store');
          return new Response(originResponse.body, {
            status: originResponse.status,
            statusText: originResponse.statusText,
            headers,
          });
        }
        const isHtmlRoute =
          request.headers.get('accept')?.includes('text/html') ||
          url.pathname.endsWith('/') ||
          !url.pathname.includes('.');
        if (isHtmlRoute) {
          const offlineHtml = buildOfflineHtml(reqId);
          const headers = {
            'content-type': 'text/html; charset=utf-8',
            'x-request-id': reqId,
            'x-route-kind': 'html',
            'cache-control': 'no-store',
            'x-cache-policy': 'no-store',
          };
          const resp = new Response(offlineHtml, { status: 200, headers });
          console.log(
            '\u26a0\ufe0f Fallback html',
            JSON.stringify({
              id: reqId,
              status: resp.status,
              path: url.pathname,
              dur: Date.now() - startTs,
            })
          );
          return resp;
        }
        // Graceful fallbacks for non-HTML requests during transient failures
        const pathname = url.pathname;
        // Images: serve a lightweight placeholder if possible
        if (/^\/assets\/images\//.test(pathname)) {
          try {
            const placeholderUrl = new URL('/assets/images/placeholder-avatar.webp', url.origin);
            const placeholderReq = new Request(placeholderUrl.toString(), request);
            const phRes = await env.ASSETS.fetch(placeholderReq);
            if (phRes && phRes.ok) {
              const headers = new Headers(phRes.headers);
              headers.set('content-type', 'image/webp');
              headers.set('cache-control', 'public, max-age=86400');
              headers.set('x-request-id', reqId);
              headers.set('x-route-kind', 'asset');
              headers.set('x-cache-policy', headers.get('cache-control') || '');
              return new Response(phRes.body, { status: 200, headers });
            }
          } catch {
            /* ignore and fall through */
          }
          // As last resort, return 204 to prevent noisy console errors
          return new Response(null, {
            status: 204,
            headers: {
              'cache-control': 'no-store',
              'x-request-id': reqId,
              'x-route-kind': 'asset',
              'x-cache-policy': 'no-store',
            },
          });
        }
      }
      // For non-5xx errors (e.g., 404), still attach diagnostics headers
      try {
        const h = new Headers(originResponse.headers);
        h.set('x-request-id', reqId);
        const pathLower = url.pathname.toLowerCase();
        const routeKind = pathLower.startsWith('/api/')
          ? 'api'
          : pathLower.endsWith('.js') ||
              pathLower.endsWith('.css') ||
              pathLower.startsWith('/_astro/') ||
              pathLower.startsWith('/assets/')
            ? 'asset'
            : 'html';
        h.set('x-route-kind', routeKind);
        const cc = h.get('cache-control') || 'no-store';
        h.set('x-cache-policy', cc);
        return new Response(originResponse.body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers: h,
        });
      } catch {
        return originResponse;
      }
    }

    const contentType = originResponse.headers.get('content-type') || '';
    if (!contentType) {
      const pathLower = url.pathname.toLowerCase();
      const guess = pathLower.endsWith('.css')
        ? 'text/css; charset=utf-8'
        : pathLower.endsWith('.js')
          ? 'application/javascript; charset=utf-8'
          : pathLower.endsWith('.json')
            ? 'application/json; charset=utf-8'
            : pathLower.endsWith('.svg')
              ? 'image/svg+xml'
              : pathLower.endsWith('.xml')
                ? 'application/xml; charset=utf-8'
                : pathLower.endsWith('.txt')
                  ? 'text/plain; charset=utf-8'
                  : pathLower.endsWith('.ico')
                    ? 'image/x-icon'
                    : '';
      if (guess) {
        const fixedHeaders = new Headers(originResponse.headers);
        fixedHeaders.set('content-type', guess);
        originResponse = new Response(originResponse.body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers: fixedHeaders,
        });
      }
    }

    const pathLower = url.pathname.toLowerCase();
    const routeKind = (() => {
      if (pathLower.startsWith('/api/')) return 'api';
      if (
        pathLower.endsWith('.js') ||
        pathLower.endsWith('.css') ||
        pathLower.startsWith('/_astro/') ||
        pathLower.startsWith('/assets/')
      )
        return 'asset';
      return 'html';
    })();
    if (method === 'GET') {
      const isHtml = originResponse.headers.get('content-type')?.includes('text/html');
      const isAssetExt =
        /\.(?:js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2|pdf)$/.test(pathLower) ||
        pathLower.startsWith('/assets/') ||
        pathLower.startsWith('/_astro/');
      const isHashed = isHashedPath(pathLower);
      const headers = new Headers(originResponse.headers);

      // Add a conservative Vary header for encoding differences
      const existingVary = headers.get('vary');
      headers.set('vary', existingVary ? `${existingVary}, Accept-Encoding` : 'Accept-Encoding');

      if (pathLower === '/sw.js' || pathLower === '/service-worker.js') {
        headers.set('cache-control', 'no-cache, no-store, must-revalidate');
        originResponse = new Response(originResponse.body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers,
        });
      } else if (
        pathLower.endsWith('/manifest.webmanifest') ||
        pathLower === '/manifest.webmanifest'
      ) {
        headers.set('cache-control', `public, max-age=${CACHE_DURATIONS.pages.manifest}`);
        originResponse = new Response(originResponse.body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers,
        });
      } else if (isAssetExt) {
        const ttl = isHashed ? CACHE_DURATIONS.static.hashed : CACHE_DURATIONS.assets.default;
        headers.set(
          'cache-control',
          isHashed ? `public, max-age=${ttl}, immutable` : `public, max-age=${ttl}`
        );
        originResponse = new Response(originResponse.body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers,
        });
      } else if (isHtml) {
        // Keep HTML fresh on clients; CDN can still keep for short periods
        headers.set(
          'cache-control',
          `public, max-age=0, must-revalidate, stale-while-revalidate=${CACHE_DURATIONS.pages.htmlStaleWhileRevalidate}`
        );
        originResponse = new Response(originResponse.body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers,
        });
      }
    }

    // Removed legacy edge optimization and personalization
    let finalResponse = originResponse;

    if (
      method === 'GET' &&
      !personalizedThemeRequest &&
      cacheStrategy.ttl > 0 &&
      finalResponse.body
    ) {
      const cacheHeaders = new Headers(finalResponse.headers);
      Object.entries(cacheStrategy.headers).forEach(([key, value]) => cacheHeaders.set(key, value));
      const [forCache, forReturn] = finalResponse.body.tee();
      const cacheResponse = new Response(forCache, {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: cacheHeaders,
      });
      ctx.waitUntil(caches.default.put(request, cacheResponse));
      finalResponse = new Response(forReturn, {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: finalResponse.headers,
      });
    }

    // Personalize HTML based on 'theme' cookie (if present)
    try {
      if (themeCookie) {
        const decodedThemeCookie = decodeURIComponent(themeCookie);
        const contentType = finalResponse.headers.get('content-type') || '';
        if (contentType.includes('text/html') && decodedThemeCookie !== 'system') {
          let html = await finalResponse.text();
          html = html.replace(/<html([^>]*)>/i, (full, attrs) => {
            let newAttrs = attrs || '';
            if (!/data-theme=/.test(newAttrs)) newAttrs += ` data-theme="${decodedThemeCookie}"`;
            if (/class=(\"|\')(.*?)\1/.test(newAttrs)) {
              newAttrs = newAttrs.replace(
                /class=(\"|\')(.*?)\1/,
                (_cm: string, q: string, cls: string) => {
                  const clsList = cls.split(/\s+/).filter(Boolean);
                  if (decodedThemeCookie === 'dark' && !clsList.includes('dark'))
                    clsList.push('dark');
                  return `class=${q}${clsList.join(' ')}${q}`;
                }
              );
            } else {
              if (decodedThemeCookie === 'dark') newAttrs += ' class="dark"';
            }
            return `<html${newAttrs}>`;
          });
          const newHeaders = new Headers(finalResponse.headers);
          // Mark personalized responses as private and vary on Cookie to prevent CDN cache leakage
          const existingVary = newHeaders.get('vary');
          newHeaders.set('vary', existingVary ? `${existingVary}, Cookie` : 'Cookie');
          newHeaders.set('cache-control', 'private, max-age=0, must-revalidate');
          newHeaders.delete('content-length');
          finalResponse = new Response(html, {
            status: finalResponse.status,
            statusText: finalResponse.statusText,
            headers: newHeaders,
          });
        }
      }
    } catch {
      /* noop personalization */
    }

    // Edge analytics disabled
    try {
      const h = new Headers(finalResponse.headers);
      h.set('x-request-id', reqId);
      h.set('x-route-kind', routeKind);
      const cc = h.get('cache-control');
      if (cc) h.set('x-cache-policy', cc);
      finalResponse = new Response(finalResponse.body, {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: h,
      });
    } catch {
      /* no-op */
    }
    const dur = Date.now() - startTs;
    const cachePolicy = finalResponse.headers.get('cache-control') || undefined;
    console.log(
      '\u2705 Request done',
      JSON.stringify({
        id: reqId,
        status: finalResponse.status,
        path: url.pathname,
        routeKind,
        dur,
        cachePolicy,
      })
    );
    return finalResponse;
  } catch (error: unknown) {
    const errStart = Date.now();
    const err = error instanceof Error ? error : new Error(String(error));

    // Capture error to Sentry with context
    Sentry.captureException(error, {
      tags: {
        function: 'edge-worker',
        method: request.method,
        path: url.pathname,
      },
      extra: {
        reqId,
        url: request.url,
      },
    });

    // Keep existing console.error for Cloudflare logs
    console.error(
      'Edge processing error:',
      JSON.stringify({ id: reqId, error: String(error), stack: err.stack, path: url.pathname })
    );

    // For API routes, return JSON errors instead of HTML
    if (url.pathname.startsWith('/api/')) {
      const errorPayload = {
        error: 'Internal server error',
        path: url.pathname,
        requestId: reqId,
      };
      return new Response(JSON.stringify(errorPayload), {
        status: 500,
        headers: {
          'content-type': 'application/json',
          'x-request-id': reqId,
          'x-route-kind': 'api-error',
          'cache-control': 'no-store',
        },
      });
    }

    const staleResponse = await caches.default.match(request);
    if (staleResponse) return staleResponse;
    const isHtmlRoute =
      request.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('/') ||
      !url.pathname.includes('.');
    if (isHtmlRoute) {
      const offlineHtml = buildOfflineHtml(reqId);
      const headers = {
        'content-type': 'text/html; charset=utf-8',
        'x-request-id': reqId,
        'x-route-kind': 'html',
        'cache-control': 'no-store',
        'x-cache-policy': 'no-store',
      };
      const resp = new Response(offlineHtml, { status: 200, headers });
      console.log(
        '\u26a0\ufe0f Fallback html',
        JSON.stringify({
          id: reqId,
          status: resp.status,
          path: url.pathname,
          dur: Date.now() - errStart,
        })
      );
      return resp;
    }
    return new Response('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-request-id': reqId,
        'x-route-kind': 'asset',
        'cache-control': 'no-store',
        'x-cache-policy': 'no-store',
      },
    });
  }
}
