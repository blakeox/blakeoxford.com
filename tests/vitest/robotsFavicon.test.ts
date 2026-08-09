import { describe, expect, it } from 'vitest';
import { handleRobotsFavicon } from '../../functions/routes/robots-favicon';

describe('robots.txt route contract', () => {
  it('serves one canonical sitemap and bounded crawl rules', async () => {
    const response = await handleRobotsFavicon({
      request: new Request('https://blakeoxford.com/robots.txt'),
      env: {} as never,
      ctx: {} as ExecutionContext,
      url: new URL('https://blakeoxford.com/robots.txt'),
      reqId: 'robots-test',
      method: 'GET',
    });

    expect(response?.status).toBe(200);
    expect(response?.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(response?.headers.get('x-robots-tag')).toBe('none');

    const body = await response?.text();
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Disallow: /search/');
    expect(body?.match(/^Sitemap: https:\/\/blakeoxford\.com\/sitemap\.xml$/gm)).toHaveLength(1);
    expect(body).not.toMatch(/^Sitemap:.*(?:sitemap-index|sitemap-\d+\.xml)/m);
  });
});
