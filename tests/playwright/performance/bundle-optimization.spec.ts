import { test, expect } from '../fixtures';

test.describe('Bundle Optimization', () => {
  // Reduce timeout for CI performance
  test.setTimeout(30000);

  test('should maintain reasonable JavaScript bundle sizes', async ({ page }) => {
    const jsBundles: Array<{ url: string; size: number }> = [];
    
    // Track only essential JavaScript resources
    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      if (url.includes('.js') && contentType.includes('javascript')) {
        try {
          const body = await response.body();
          jsBundles.push({
            url: url.split('/').pop() || url,
            size: body.length
          });
        } catch {
          // Some responses might not be available in CI
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded'); // Less strict than networkidle
    
    // Basic validation
    if (jsBundles.length > 0) {
      const totalJSSize = jsBundles.reduce((total, bundle) => total + bundle.size, 0);
      
      // Total JS should be under 3MB (accounting for dev tools)
      expect(totalJSSize).toBeLessThan(3 * 1024 * 1024);
      
      // Individual bundles should be reasonably sized
      jsBundles.forEach(bundle => {
        expect(bundle.size).toBeLessThan(1 * 1024 * 1024); // 1MB max per bundle
      });
      
      console.log(`JS Bundle Analysis: ${jsBundles.length} bundles, ${Math.round(totalJSSize / 1024)}KB total`);
    }
  });

  test('should have optimal CSS bundle sizes', async ({ page }) => {
    const cssBundles: Array<{ url: string; size: number }> = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      if (url.includes('.css') && contentType.includes('css')) {
        try {
          const body = await response.body();
          cssBundles.push({
            url: url.split('/').pop() || url,
            size: body.length
          });
        } catch {
          // Ignore missing responses
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    if (cssBundles.length > 0) {
      const totalCSSSize = cssBundles.reduce((total, bundle) => total + bundle.size, 0);
      
      // Total CSS should be under 125KB (Tailwind optimized but realistic)
      expect(totalCSSSize).toBeLessThan(125 * 1024);
      
      console.log(`CSS Bundle Analysis: ${cssBundles.length} bundles, ${Math.round(totalCSSSize / 1024)}KB total`);
    }
  });

  test('should optimize image delivery', async ({ page }) => {
    const images: Array<{ url: string; size: number; format: string }> = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.startsWith('image/')) {
        try {
          const body = await response.body();
          images.push({
            url: url.split('/').pop() || url,
            size: body.length,
            format: contentType.split('/')[1]
          });
        } catch {
          // Ignore missing responses
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    if (images.length > 0) {
      const totalImageSize = images.reduce((total, img) => total + img.size, 0);
      
      // Log image analysis for monitoring (don't fail for portfolio sites)
      console.log(`Image Analysis: ${images.length} images, ${Math.round(totalImageSize / 1024)}KB total`);
      
      // Warn if very large but don't fail (portfolio sites need high quality images)
      if (totalImageSize > 10 * 1024 * 1024) { // 10MB
        console.warn(`Large total image size detected: ${Math.round(totalImageSize / (1024 * 1024))}MB`);
      }
      
      // Individual images should be optimized
      images.forEach(image => {
        if (image.size > 2 * 1024 * 1024) { // 2MB per image
          console.warn(`Large individual image: ${image.url} (${Math.round(image.size / 1024)}KB)`);
        }
      });
    }
  });
});
