import type { RouteContext } from '../shared/route-context';

/** Legacy Find index paths → canonical `/search/*` (Workers run_worker_first bypasses static `_redirects`). */
const LEGACY_SEARCH_REDIRECTS: Readonly<Record<string, string>> = {
  '/api/projects.json': '/search/projects.json',
  '/api/blog.json': '/search/blog.json',
};

export function legacySearchRedirectTarget(pathname: string): string | null {
  return LEGACY_SEARCH_REDIRECTS[pathname] ?? null;
}

export async function handleLegacySearchRedirect({
  request,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  const targetPath = legacySearchRedirectTarget(url.pathname);
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
