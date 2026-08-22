import { afterEach, describe, expect, it, vi } from 'vitest';
import { addQueryNoindexMeta, handleAssets } from '../../../functions/routes/assets';

function context(pathname: string, response: Response, headers?: HeadersInit) {
  const cacheMatch = vi.fn().mockResolvedValue(null);
  const cachePut = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('caches', { default: { match: cacheMatch, put: cachePut } });
  const request = new Request(`https://blakeoxford.com${pathname}`, { headers });
  if (headers && 'cookie' in headers) {
    Object.defineProperty(request, 'headers', {
      value: new Headers({ cookie: String((headers as Record<string, unknown>).cookie) }),
    });
  }
  return {
    request,
    env: { ASSETS: { fetch: vi.fn().mockResolvedValue(response) } },
    ctx: { waitUntil: vi.fn() },
    url: new URL(`https://blakeoxford.com${pathname}`),
    reqId: 'asset-test',
    method: 'GET',
    Sentry: { captureException: vi.fn() },
    cacheMatch,
    cachePut,
  } as any;
}

describe('asset route cache and failure contract', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('preserves API origin failures instead of returning an empty 200 response', async () => {
    const ctx = context('/api/missing', new Response('{"error":"origin"}', { status: 502 }));
    const response = await handleAssets(ctx);

    expect(response.status).toBe(502);
    expect(await response.text()).toContain('origin');
  });

  it('does not read or write shared HTML cache for a theme-personalized request', async () => {
    const ctx = context(
      '/about/',
      new Response('<html><head></head><body>about</body></html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
      { cookie: 'theme=dark' }
    );
    expect(ctx.request.headers.get('cookie')).toBe('theme=dark');

    const response = await handleAssets(ctx);
    const html = await response.text();

    expect(html).toContain('data-theme="dark"');
    expect(ctx.cacheMatch).not.toHaveBeenCalled();
    expect(ctx.cachePut).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toContain('private');
  });

  it('applies the public cache contract to static assets', async () => {
    const ctx = context(
      '/_astro/app.abc123.css',
      new Response('body', { headers: { 'content-type': 'text/css' } })
    );

    const response = await handleAssets(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('x-route-kind')).toBe('asset');
    expect(response.headers.get('x-cache-policy')).toBe('public, max-age=31536000, immutable');
    expect(ctx.cachePut).toHaveBeenCalledOnce();
  });
  it('aligns query-bearing HTML metadata with the edge noindex header policy', async () => {
    const ctx = context(
      '/projects/?filter=healthcare-it',
      new Response(
        '<html><head><meta name="robots" content="index, follow"></head><body>projects</body></html>',
        { headers: { 'content-type': 'text/html; charset=utf-8', etag: 'stale' } }
      )
    );

    const response = await handleAssets(ctx);
    const html = await response.text();

    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(html).not.toContain('content="index, follow"');
    expect(response.headers.get('etag')).toBeNull();
    expect(ctx.cachePut).toHaveBeenCalledOnce();

    const cached = ctx.cachePut.mock.calls[0]?.[1] as Response;
    expect(await cached.text()).toContain('content="noindex, nofollow"');
  });

  it('adds a robots directive when query HTML has no existing robots meta tag', async () => {
    const response = await addQueryNoindexMeta(
      new Response('<html><head><title>Projects</title></head></html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
      new URL('https://blakeoxford.com/projects/?filter=healthcare-it')
    );

    expect(await response.text()).toContain('<meta name="robots" content="noindex, nofollow" />');
  });

  it('rewrites offline HTML returned for query-bearing origin failures', async () => {
    const ctx = context(
      '/projects/?filter=healthcare-it',
      new Response('origin unavailable', { status: 503 })
    );

    const response = await handleAssets(ctx);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<meta name="robots" content="noindex, nofollow" />');
  });

  it('rewrites offline HTML returned after an asset fetch exception', async () => {
    const ctx = context(
      '/projects/?filter=healthcare-it',
      new Response('<html><head><meta name="robots" content="index, follow"></head></html>')
    );
    ctx.env.ASSETS.fetch.mockRejectedValue(new Error('origin unavailable'));

    const response = await handleAssets(ctx);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<meta name="robots" content="noindex, nofollow" />');
  });

  it('clears entity headers even when the query robots tag is already correct', async () => {
    const response = await addQueryNoindexMeta(
      new Response('<html><head><meta name="robots" content="noindex, nofollow" /></head></html>', {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'content-encoding': 'gzip',
          'content-length': '88',
          etag: 'stale',
        },
      }),
      new URL('https://blakeoxford.com/projects/?filter=healthcare-it')
    );

    expect(await response.text()).toContain('noindex, nofollow');
    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('content-length')).toBeNull();
    expect(response.headers.get('etag')).toBeNull();
  });
});
