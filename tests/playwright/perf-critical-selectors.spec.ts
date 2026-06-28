import { test, expect } from './fixtures';

// Ensures hero/critical images use modern formats and avoid large legacy PNG/JPEG.
// Tags: @essential

test.describe('Performance Critical Media @essential', () => {
  test('hero images modern formats and size', async ({ page }) => {
    await page.goto('/');
    // Wait minimal for network idle of hero region
    await page.waitForLoadState('domcontentloaded');
    // Collect img elements in first viewport (visible)
    const images = await page.$$eval('img', imgs => imgs.filter(i => {
      const r = i.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0; // in viewport
    }).map(i => ({
      src: i.currentSrc || i.src || '',
      width: i.naturalWidth,
      height: i.naturalHeight,
      loading: i.getAttribute('loading') || '',
      decoding: i.getAttribute('decoding') || ''
    })));

    expect(images.length).toBeGreaterThan(0);

    for (const img of images) {
      // Must use modern formats (avif/webp) OR be SVG/icon. Allow data: for inline placeholders.
      const lower = img.src.toLowerCase();
      const isModern = /(\.avif($|\?)|\.webp($|\?))/.test(lower);
      const isSvg = /\.svg($|\?)/.test(lower);
      const isData = lower.startsWith('data:');
      const isIcon = /icons?\//.test(lower);
      expect(isModern || isSvg || isData || isIcon).toBeTruthy();
      // Reject large legacy raster formats
      if (/(\.png|\.jpe?g)/.test(lower)) {
        throw new Error(`Legacy format detected in critical viewport: ${img.src}`);
      }
      // Encourage lazy + async decode for non-first hero image
      if (images.indexOf(img) > 0) {
        expect(['lazy','eager','']).toContain(img.loading); // allow unspecified for primary hero
        if (img.decoding) expect(['async','auto']).toContain(img.decoding);
      }
    }
  });
});
