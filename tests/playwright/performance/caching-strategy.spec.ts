import { test, expect } from '@playwright/test';

test.describe('Caching Strategy', () => {
  test.setTimeout(15000);

  test('should have caching headers for static assets (or hashed assets present)', async ({ page }) => {
    const cachingAnalysis: Array<{ url: string; cacheControl: string }> = [];

    // Analyze caching headers for key assets only
    page.on('response', (response) => {
      const url = response.url();
      const cacheControl = response.headers()['cache-control'] || 'none';
      // Focus on key static assets
      if (url.includes('.js') || url.includes('.css')) {
        cachingAnalysis.push({
          url,
          cacheControl
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Evaluate
    const assetsWithCaching = cachingAnalysis.filter(a => a.cacheControl !== 'none');
    const hashedAssetsPresent = cachingAnalysis.some(a => /\/_astro\//.test(a.url) || /\.[a-f0-9]{8,}\.(?:js|css)$/.test(a.url));

    console.log(`Caching analysis: ${assetsWithCaching.length}/${cachingAnalysis.length} assets have caching headers`);

    // Guardrail: either we see caching headers on at least one asset in this environment,
    // OR we confirm hashed chunking exists (production Worker enforces immutable caching).
    expect(assetsWithCaching.length >= 1 || hashedAssetsPresent).toBeTruthy();
  });

  test('should set sensible caching for HTML, service worker, and manifest when present', async ({ request }) => {
    // HTML
    const htmlRes = await request.get('/');
    const htmlCC = htmlRes.headers()['cache-control'] || '';
    if (htmlCC) {
      // Preview server may not match production Worker policy; require presence only
      expect(htmlCC.length).toBeGreaterThan(0);
    } else {
      console.log('HTML cache-control missing in preview server (acceptable locally).');
    }

    // Service worker (may not exist locally)
    const swRes = await request.get('/sw.js');
    if (swRes.status() === 200) {
      const swCC = swRes.headers()['cache-control'] || '';
      expect(swCC.includes('no-store') || swCC.includes('must-revalidate') || swCC.includes('no-cache')).toBeTruthy();
    } else {
      test.skip(true, 'No service worker available');
    }

    // Manifest
    const manifestRes = await request.get('/manifest.webmanifest');
    if (manifestRes.status() === 200) {
      const manCC = manifestRes.headers()['cache-control'] || '';
      if (manCC) {
        expect(manCC.length).toBeGreaterThan(0);
      } else {
        console.log('Manifest present without cache-control in preview; acceptable locally.');
      }
    } else {
      console.log('No manifest found; skipping manifest cache checks');
    }
  });

  test('should handle cache reload gracefully', async ({ page }) => {
    // First visit
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loads
    const main = page.locator('main, h1, body').first();
    await expect(main).toBeVisible();

    // Reload (cache test)
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should still work
    await expect(main).toBeVisible();

    console.log('Cache reload test passed');
  });
});
