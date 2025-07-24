import { test, expect } from '@playwright/test';

test.describe('Performance Budget', () => {
  // Shorter timeout for CI
  test.setTimeout(20000);

  test('should meet basic performance thresholds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Simple performance check
    const performanceMetrics = await page.evaluate(() => {
      const metrics: Record<string, number> = {};
      
      // Basic timing measurement
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0] as any;
        metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
      }
      
      // First Contentful Paint
      const paintEntries = window.performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
        }
      });
      
      return metrics;
    });
    
    console.log('Performance Metrics:', performanceMetrics);
    
    // Basic thresholds
    if (performanceMetrics.domContentLoaded) {
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2s DOM ready
    }
    
    if (performanceMetrics.fcp) {
      expect(performanceMetrics.fcp).toBeLessThan(3000); // 3s FCP
    }
  });

  test('should maintain reasonable page load times', async ({ page }) => {
    const pages = ['/', '/about', '/projects'];
    const loadTimes: Array<{ page: string; loadTime: number }> = [];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      loadTimes.push({ page: pagePath, loadTime });
      
      // Each page should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds (relaxed for CI)
    }
    
    console.log('Page Load Times:', loadTimes.map(p => `${p.page}: ${p.loadTime}ms`));
  });

  test('should have reasonable resource counts', async ({ page }) => {
    const resourceCounts = {
      total: 0,
      js: 0,
      css: 0,
      images: 0
    };
    
    // Track key resources only
    page.on('response', (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      resourceCounts.total++;
      
      if (contentType.includes('javascript') || url.includes('.js')) {
        resourceCounts.js++;
      } else if (contentType.includes('css') || url.includes('.css')) {
        resourceCounts.css++;
      } else if (contentType.startsWith('image/')) {
        resourceCounts.images++;
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Resource count budgets (relaxed for CI)
    expect(resourceCounts.total).toBeLessThan(200); // Total requests
    expect(resourceCounts.js).toBeLessThan(100);    // JS files
    expect(resourceCounts.css).toBeLessThan(30);    // CSS files
    
    console.log('Resource Counts:', resourceCounts);
  });
});
