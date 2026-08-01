import type { RouteContext } from '../shared/route-context';

const BLOCKED_DEBUG_PATHS = new Set(['/debug/sentry-test', '/debug/sentry-test/']);

export function handleDebug({ url, reqId }: RouteContext): Response | null {
  if (!BLOCKED_DEBUG_PATHS.has(url.pathname)) return null;

  return new Response(null, {
    status: 404,
    headers: {
      'cache-control': 'no-store',
      'x-request-id': reqId,
      'x-route-kind': 'blocked-debug',
      'x-cache-policy': 'no-store',
    },
  });
}
