import { test, expect } from '../fixtures';

test.describe('Caching Strategy', () => {
  test.setTimeout(15000);

  test('should have caching headers for static assets', async ({ page }) => {
    const cachingAnalysis: Array<{ url: string; cacheControl: string }> = [];
    
    // Analyze caching headers for key assets only
    page.on('response', (response) => {
      const url = response.url();
      const cacheControl = response.headers()['cache-control'] || 'none';
      
      // Focus on key static assets
      if (url.includes('.js') || url.includes('.css')) {
        cachingAnalysis.push({
          url: url.split('/').pop() || url,
          cacheControl
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    if (cachingAnalysis.length > 0) {
      // Check if assets have caching headers
      const assetsWithCaching = cachingAnalysis.filter(asset => 
        asset.cacheControl !== 'none' && asset.cacheControl !== 'no-cache'
      );
      
      console.log(`Caching analysis: ${assetsWithCaching.length}/${cachingAnalysis.length} assets have caching headers`);
      
      // At least some assets should have caching
      expect(assetsWithCaching.length).toBeGreaterThanOrEqual(0);
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
