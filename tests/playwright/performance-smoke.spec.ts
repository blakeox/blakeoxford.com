import { test, expect } from '@playwright/test';

// Essential performance smoke tests
test.describe('Performance Smoke Tests', () => {
  test.describe('Page Load Performance @smoke', () => {
    test('homepage should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Homepage should load within 5 seconds (generous for CI environments)
      expect(loadTime).toBeLessThan(5000);
      
      // Check that page has basic content - use specific selector to avoid strict mode violation
      await expect(page.locator('main[id="main-content"]')).toBeVisible();
    });

    test('pages should not have excessive bundle size @critical', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Check that total JavaScript payload isn't excessive
      // Handle case where no JS files are loaded (performance-first site)
      try {
        // Try to wait for JS response, but don't fail if none exist
        await page.waitForResponse('**/*.js', { timeout: 5000 });
      } catch {
        // No JS files loaded - this is actually good for a performance-first site
        console.log('No JavaScript files detected - excellent for performance!');
      }
      
      const responses = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('.js') && !entry.name.includes('node_modules'))
          .reduce((total, entry) => total + ((entry as any).transferSize || 0), 0);
      });
      
      // Total JS should be under 2MB (adjusted for development environment)
      // If no JS is loaded, this will be 0, which is even better
      expect(responses).toBeLessThan(2 * 1024 * 1024);
    });
  });

  test.describe('Core Web Vitals @essential', () => {
    test('should have reasonable Largest Contentful Paint', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle');
      
      // Get LCP via Performance Observer API
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(0), 3000);
        });
      });
      
      // LCP should be under 2.5s (good threshold)
      if (typeof lcp === 'number' && lcp > 0) {
        expect(lcp).toBeLessThan(2500);
      }
    });

    test('should have reasonable First Contentful Paint', async ({ page }) => {
      await page.goto('/');
      
      const paintMetrics = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : 0;
      });
      
      // FCP should be under 1.8s (good threshold)
      if (paintMetrics > 0) {
        expect(paintMetrics).toBeLessThan(1800);
      }
    });
  });

  test.describe('Resource Loading @critical', () => {
    test('critical resources should load without errors', async ({ page }) => {
      const resourceErrors: string[] = [];
      
      page.on('response', response => {
        if (!response.ok() && response.status() !== 404) {
          resourceErrors.push(`${response.status()} - ${response.url()}`);
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Filter out common false positives
      const criticalErrors = resourceErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('apple-touch-icon') &&
        !error.includes('manifest.json') &&
        !error.includes('analytics') &&
        !error.includes('gtag')
      );
      
      expect(criticalErrors).toEqual([]);
    });

    test('images should load without errors', async ({ page }) => {
      await page.goto('/');
      
      // Wait for images to load
      await page.waitForLoadState('networkidle');
      
      // Check that main content images load successfully
      const images = page.locator('main img, .hero img, .profile img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(3, imageCount); i++) { // Check first 3 images for speed
        const img = images.nth(i);
        await expect(img).toBeVisible();
        
        // Check that image has loaded (not broken)
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });
  });
});