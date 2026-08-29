import type { RouteContext } from '../shared/route-context';

/** Legacy mixed-case project paths → canonical lowercase project paths. */
const LEGACY_PROJECT_REDIRECTS: Readonly<Record<string, string>> = {
  '/projects/Microsoft-Fabric/': '/projects/microsoft-fabric/',
};

export function legacyProjectRedirectTarget(pathname: string): string | null {
  return LEGACY_PROJECT_REDIRECTS[pathname] ?? null;
}

export async function handleLegacyProjectRedirect({
  request,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  const targetPath = legacyProjectRedirectTarget(url.pathname);
  if (!targetPath) return null;

  const isGetLike = request.method === 'GET' || request.method === 'HEAD';
  if (!isGetLike) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        allow: 'GET, HEAD',
        'x-request-id': reqId,
        'x-route-kind': 'redirect',
        'cache-control': 'no-store',
      },
    });
  }

  const target = new URL(targetPath, url.origin);
  target.search = url.search;

  const redirect = Response.redirect(target.toString(), 301);
  const headers = new Headers(redirect.headers);
  headers.set('x-request-id', reqId);
  headers.set('x-route-kind', 'redirect');
  headers.set('x-cache-policy', 'no-store');
  headers.set('cache-control', 'public, max-age=3600');

  return new Response(redirect.body, {
    status: redirect.status,
    statusText: redirect.statusText,
    headers,
  });
}
