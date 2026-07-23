import { addEdgeBreadcrumb } from '../../sentry.edge.config.js';
import type { RouteContext } from '../shared/route-context';

export async function handleHealth({
  url,
  reqId,
  method,
  Sentry,
}: RouteContext): Promise<Response | null> {
  if (url.pathname === '/_healthz' || url.pathname === '/_healthz/') {
    return new Response(null, {
      status: 204,
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate',
        'content-type': 'text/plain; charset=utf-8',
        'content-length': '0',
        'x-content-type-options': 'nosniff',
        'x-request-id': reqId,
        'x-route-kind': 'health',
        'x-cache-policy': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  if (url.pathname === '/debug/edge-sentry-test') {
    try {
      addEdgeBreadcrumb({
        category: 'debug',
        message: 'Triggering Sentry edge test error',
        level: 'info',
        data: { reqId },
      });
      throw new Error('Sentry Edge Test: manual trigger from /debug/edge-sentry-test');
    } catch (err) {
      try {
        Sentry?.captureException?.(err, {
          tags: { route: 'debug-edge-sentry-test' },
          extra: { reqId, path: url.pathname, method },
        });
      } catch {
        /* swallow */
      }
      return new Response('Edge test error captured. Check Sentry project for an event.', {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
          'x-request-id': reqId,
          'x-route-kind': 'debug',
          'x-cache-policy': 'no-store',
        },
      });
    }
  }

  if (url.pathname === '/metrics/' || url.pathname === '/metrics') {
    return new Response(null, {
      status: 204,
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate',
        'content-type': 'text/plain; charset=utf-8',
        'content-length': '0',
        'x-content-type-options': 'nosniff',
        'x-request-id': reqId,
        'x-route-kind': 'health',
        'x-cache-policy': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  return null;
}
