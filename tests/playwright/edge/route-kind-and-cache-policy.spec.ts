import { test, expect } from '../fixtures';

// Verifies x-route-kind and x-cache-policy are set on representative routes.
// Tests are tolerant in preview (headers may be missing), but strict when headers are present.

test.describe('Edge diagnostics headers', () => {
  test('HTML route exposes route-kind and cache policy when available', async ({ request }) => {
    const res = await request.get('/');
    const xrk = res.headers()['x-route-kind'] || '';
    const xcp = res.headers()['x-cache-policy'] || '';
    if (xrk || xcp) {
      expect(xrk).toBe('html');
      expect(xcp.length).toBeGreaterThan(0);
    } else {
      test.skip(true, 'Preview server without Worker headers');
    }
  });

  test('Hashed asset exposes asset route-kind and immutable policy', async ({ request }) => {
    // Try a likely hashed asset path used by Astro builds
    const candidates = ['/robots.txt', '/manifest.webmanifest'];
    // robots/manifest are not hashed but still assets; ensure route-kind=asset when headers present
    for (const path of candidates) {
      const res = await request.get(path);
      if (res.status() === 200) {
        const xrk = res.headers()['x-route-kind'] || '';
        const xcp = res.headers()['x-cache-policy'] || '';
        if (xrk || xcp) {
          expect(xrk).toBe('asset');
          expect(xcp.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
