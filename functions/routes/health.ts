import type { RouteContext } from '../shared/route-context';

export async function handleHealth({ url, reqId, env }: RouteContext): Promise<Response | null> {
  if (url.pathname === '/__version' || url.pathname === '/__version/') {
    return new Response(
      JSON.stringify({ commit: env.GIT_COMMIT ?? null, environment: env.ENVIRONMENT ?? null }),
      {
        status: 200,
        headers: {
          'cache-control': 'no-store',
          'content-type': 'application/json; charset=utf-8',
          'x-request-id': reqId,
          'x-route-kind': 'health',
          'x-cache-policy': 'no-store',
        },
      }
    );
  }
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
