import type { RouteContext } from '../shared/route-context';

export async function handleRobotsFavicon({
  request,
  env,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  if (url.pathname === '/favicon.ico') {
    try {
      const pngUrl = new URL('/assets/images/favicon-32x32.png', url.origin);
      const pngReq = new Request(pngUrl.toString(), request);
      let icon = await env.ASSETS.fetch(pngReq);
      if (!icon.ok) return icon;
      const headers = new Headers(icon.headers);
      headers.set('content-type', 'image/x-icon');
      headers.set('cache-control', 'public, max-age=31536000, immutable');
      headers.set('x-request-id', reqId);
      headers.set('x-route-kind', 'asset');
      headers.set('x-cache-policy', headers.get('cache-control') || '');
      return new Response(icon.body, {
        status: icon.status,
        statusText: icon.statusText,
        headers,
      });
    } catch {
      return new Response(null, {
        status: 404,
        headers: { 'x-request-id': reqId, 'x-route-kind': 'asset', 'x-cache-policy': 'no-store' },
      });
    }
  }

  if (url.pathname === '/robots.txt') {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /search/

Sitemap: https://blakeoxford.com/sitemap.xml`;

    return new Response(robotsTxt, {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=300, no-transform',
        'cf-robots-txt': 'bypass',
        'x-robots-tag': 'none',
        'x-request-id': reqId,
        'x-route-kind': 'asset',
        'x-cache-policy': 'public, max-age=300, no-transform',
      },
    });
  }

  return null;
}
