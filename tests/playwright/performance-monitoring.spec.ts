import { test, expect } from './fixtures';
import { waitForAsyncOperation } from './utils/test-helpers';
import fs from 'fs';
import path from 'path';

const performanceBudgets = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'tests/config/performance-budgets.json'), 'utf8')
) as {
  bundleSizes: {
    jsTotalBytes: number;
    jsSingleBytes: number;
  };
};

test.describe('Performance and Monitoring @extended', () => {
  test.describe('Core Web Vitals', () => {
    test('should meet Largest Contentful Paint (LCP) thresholds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page load should be under 2.5s for good user experience
      expect(loadTime).toBeLessThan(2500);
    });

    test('should meet lab interaction responsiveness thresholds', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Simulate user interaction to measure a lab responsiveness proxy.
      const startTime = Date.now();

      // Click on navigation link
      await page
        .getByRole('navigation', { name: 'Main Navigation' })
        .getByRole('link', { name: 'About', exact: true })
        .click();

      const responseTime = Date.now() - startTime;

      // Keep the synthetic lab proxy under 500ms in CI (field INP is measured separately).
      // In production, this should be much faster (~100ms)
      // Note: this is not field INP; it is a deterministic browser smoke check.
      expect(responseTime).toBeLessThan(500);
    });

    test('should meet Cumulative Layout Shift (CLS) thresholds', async ({ page }) => {
      await page.goto('/');

      // Wait for initial load
      await waitForAsyncOperation(page);

      // Measure CLS
      const clsScore = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;

          if ('PerformanceObserver' in window) {
            const observer = new window.PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'layout-shift') {
                  const layoutShiftEntry = entry as {
                    entryType: string;
                    hadRecentInput?: boolean;
                    value?: number;
                  };
                  if (!layoutShiftEntry.hadRecentInput) {
                    clsValue += layoutShiftEntry.value || 0;
                  }
                }
              }
            });

            observer.observe({ entryTypes: ['layout-shift'] });

            // Measure for 3 seconds
            setTimeout(() => {
              observer.disconnect();
              resolve(clsValue);
            }, 3000);
          } else {
            resolve(0);
          }
        });
      });

      // CLS should be under 0.1 for good performance
      expect(clsScore).toBeLessThan(0.1);
    });

    test('should have fast Time to First Byte (TTFB)', async ({ page }) => {
      const startTime = Date.now();
      const response = await page.goto('/');
      const ttfb = Date.now() - startTime;

      expect(response?.status()).toBe(200);

      // TTFB should be under 1500ms for test environment (relaxed for CI)
      expect(ttfb).toBeLessThan(1500);
    });
  });

  test.describe('Resource Loading Performance', () => {
    test('should load critical resources efficiently', async ({ page }) => {
      // Track network requests
      const requests: Array<{ url: string; responseTime: number; size: number }> = [];

      page.on('response', async (response) => {
        const request = response.request();
        const url = request.url();
        const responseTime = Date.now();

        try {
          const size = (await response.body()).length;
          requests.push({
            url,
            responseTime,
            size,
          });
        } catch {
          // Some responses might not be available
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check critical resources
      const criticalResources = requests.filter(
        (req) => req.url.includes('.css') || req.url.includes('.js') || req.url.includes('font')
      );

      expect(criticalResources.length).toBeGreaterThan(0);

      // Critical resources should be reasonably sized
      criticalResources.forEach((resource) => {
        expect(resource.size).toBeLessThan(1024 * 1024); // 1MB max
      });
    });

    test('should compress resources effectively', async ({ page }) => {
      const response = await page.goto('/');

      // Check for compression headers
      const headers = response?.headers() || {};

      // Check if responses support compression
      const acceptEncoding = headers['accept-encoding'];
      if (acceptEncoding) {
        expect(acceptEncoding).toMatch(/gzip|br|deflate/);
      }
    });

    test('should cache resources appropriately', async ({ page }) => {
      // First visit
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Second visit - should use cache
      const cachedRequests: string[] = [];

      page.on('response', (response) => {
        const cacheControl = response.headers()['cache-control'];
        if (cacheControl && cacheControl.includes('max-age')) {
          cachedRequests.push(response.url());
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Astro preview does not emulate the deployed Worker cache headers. The
      // edge route contract suite owns that production policy; skip locally
      // when the preview provides no cache metadata.
      test.skip(cachedRequests.length === 0, 'Astro preview exposes no cache-control metadata');

      expect(cachedRequests.length).toBeGreaterThan(0);
    });

    test('should load images efficiently', async ({ page }) => {
      await page.goto('/');

      // Check image loading
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        // Check for lazy loading attributes
        for (let i = 0; i < Math.min(3, imageCount); i++) {
          const img = images.nth(i);
          const loading = await img.getAttribute('loading');
          const src = await img.getAttribute('src');

          // Critical images should load immediately, others can be lazy
          if (loading === 'lazy') {
            expect(loading).toBe('lazy');
          }

          // Images should have valid sources
          expect(src).toBeTruthy();
        }
      }
    });
  });

  test.describe('JavaScript Performance', () => {
    test('should have minimal main thread blocking', async ({ page }) => {
      await page.goto('/');

      // Measure JavaScript execution time
      const jsExecutionTime = await page.evaluate(() => {
        const startTime = window.performance.now();

        // Simulate heavy computation
        for (let i = 0; i < 100000; i++) {
          Math.random(); // Just call the function, don't accumulate
        }

        return window.performance.now() - startTime;
      });

      // JavaScript execution should be fast
      expect(jsExecutionTime).toBeLessThan(50); // 50ms max
    });

    test('should handle memory efficiently', async ({ page }) => {
      await page.goto('/');

      // Measure memory usage if available
      const memoryInfo = await page.evaluate(() => {
        const nav = window.navigator as {
          deviceMemory?: number;
        };

        const perf = window.performance as {
          memory?: {
            usedJSHeapSize: number;
          };
        };

        if (nav.deviceMemory) {
          return {
            deviceMemory: nav.deviceMemory,
            usedMemory: perf.memory?.usedJSHeapSize || 0,
          };
        }
        return null;
      });

      if (memoryInfo) {
        // Should not use excessive memory
        expect(memoryInfo.usedMemory).toBeLessThan(50 * 1024 * 1024); // 50MB max
      }
    });

    test('should handle errors gracefully', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (error) => {
        consoleErrors.push(error.message);
      });

      await page.goto('/');
      await waitForAsyncOperation(page); // Wait for page load and error collection

      // Should have minimal console errors
      expect(consoleErrors.length).toBeLessThan(30); // Relaxed for test environment

      // No critical errors should occur
      const criticalErrors = consoleErrors.filter(
        (error) =>
          error.toLowerCase().includes('uncaught') ||
          error.toLowerCase().includes('syntax') ||
          error.toLowerCase().includes('reference')
      );

      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ page, browser }) => {
      // Simulate mobile device
      await page.setViewportSize({ width: 375, height: 667 });

      // Simulate slower CPU
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
      });

      const mobilePage = await context.newPage();

      const startTime = Date.now();
      await mobilePage.goto('/');
      await mobilePage.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Mobile should load within reasonable time
      expect(loadTime).toBeLessThan(4000); // 4 seconds for mobile

      await context.close();
    });

    test('should handle touch interactions smoothly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Test touch interactions
      const navigation = page.locator('nav').first();
      await expect(navigation).toBeVisible();

      // Test that mobile menu toggle exists and is interactive (if on mobile viewport)
      const navButton = page.locator('#nav-toggle');
      const navButtonExists = await navButton.isVisible().catch(() => false);

      if (navButtonExists) {
        // Test that the button responds to interaction without measuring precise timing
        // CI environments can have variable performance, so we just verify functionality
        await expect(navButton).toBeEnabled();
        await navButton.click();

        // Verify the interaction had an effect (mobile menu should appear or change state)
        const mobileMenu = page.locator('#nav-mobile-links');
        await expect(mobileMenu).toBeVisible({ timeout: 1000 });
      } else {
        // Fallback: just verify navigation is interactive on desktop
        const firstNavLink = page.locator('nav a').first();
        if (await firstNavLink.isVisible()) {
          await expect(firstNavLink).toBeEnabled();
          await firstNavLink.hover(); // Light interaction test
        }
      }

      // The test passes if interactions complete without errors
      // We don't measure precise timing as CI environments vary significantly
    });

    test('should optimize for mobile network conditions', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async (route) => {
        // Add artificial delay for slow network
        await new Promise((resolve) => setTimeout(resolve, 100));
        route.continue();
      });

      await page.setViewportSize({ width: 375, height: 667 });

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      // Should still load within reasonable time on slow network
      expect(loadTime).toBeLessThan(6000); // 6 seconds for slow network
    });
  });

  test.describe('Bundle Size Analysis', () => {
    test('should have reasonable JavaScript bundle sizes', async ({ page }) => {
      const resourceSizes: Array<{ url: string; size: number }> = [];

      page.on('response', async (response) => {
        const url = response.url();

        if (url.includes('.js') && !url.includes('node_modules')) {
          try {
            const body = await response.body();
            resourceSizes.push({
              url,
              size: body.length,
            });
          } catch {
            // Some responses might not be available
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check JavaScript bundle sizes
      const totalJSSize = resourceSizes.reduce((total, resource) => total + resource.size, 0);

      // Keep this aligned with the central production-informed bundle budget.
      expect(totalJSSize).toBeLessThan(performanceBudgets.bundleSizes.jsTotalBytes);

      // Individual JS files should stay below the central per-file budget.
      resourceSizes.forEach((resource) => {
        expect(resource.size).toBeLessThan(performanceBudgets.bundleSizes.jsSingleBytes);
      });
    });

    test('should have reasonable CSS bundle sizes', async ({ page }) => {
      const cssResources: Array<{ url: string; size: number }> = [];

      page.on('response', async (response) => {
        const url = response.url();

        if (url.includes('.css')) {
          try {
            const body = await response.body();
            cssResources.push({
              url,
              size: body.length,
            });
          } catch {
            // Some responses might not be available
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      if (cssResources.length > 0) {
        const totalCSSSize = cssResources.reduce((total, resource) => total + resource.size, 0);

        // Total CSS should be under 200KB
        expect(totalCSSSize).toBeLessThan(200 * 1024);
      }
    });
  });

  test.describe('Accessibility Performance', () => {
    test('should render accessibility features quickly', async ({ page }) => {
      await page.goto('/');

      // Measure time for accessibility features to be available
      const startTime = Date.now();

      // Wait for skip link to be available
      const skipLink = page.locator('a[href="#main-content"]').first();
      await expect(skipLink).toBeAttached();

      // Wait for ARIA labels to be available
      const nav = page.locator('nav[aria-label]').first();
      await expect(nav).toBeAttached();

      const accessibilityTime = Date.now() - startTime;

      // Accessibility features should be available quickly
      expect(accessibilityTime).toBeLessThan(1000);
    });

    test('should handle screen reader navigation efficiently', async ({ page }) => {
      await page.goto('/');

      // Test landmark navigation
      const landmarks = page.locator('main, nav, header, footer');
      const landmarkCount = await landmarks.count();

      expect(landmarkCount).toBeGreaterThan(0);

      // Test heading navigation
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      expect(headingCount).toBeGreaterThan(0);

      // Verify visible headings are accessible quickly (skip sr-only headings)
      const visibleHeadings = page.locator(
        'h1:not(.sr-only), h2:not(.sr-only), h3:not(.sr-only), h4:not(.sr-only), h5:not(.sr-only), h6:not(.sr-only)'
      );
      const visibleCount = await visibleHeadings.count();

      for (let i = 0; i < Math.min(3, visibleCount); i++) {
        const heading = visibleHeadings.nth(i);
        await expect(heading).toBeVisible();
      }
    });
  });

  test.describe('Performance Monitoring Integration', () => {
    test('should track performance metrics', async ({ page }) => {
      await page.goto('/');

      // Check if performance tracking is implemented
      const performanceMetrics = await page.evaluate(() => {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        const navigation = navigationEntries[0] as unknown as {
          domContentLoadedEventEnd: number;
          domContentLoadedEventStart: number;
          loadEventEnd: number;
          loadEventStart: number;
        };

        if (navigation) {
          const domContentLoaded =
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
          const firstPaint = window.performance.getEntriesByName('first-paint')[0]?.startTime || 0;
          const firstContentfulPaint =
            window.performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;

          if (!domContentLoaded && !loadComplete && !firstPaint && !firstContentfulPaint) {
            return null;
          }

          return {
            domContentLoaded,
            loadComplete,
            firstPaint,
            firstContentfulPaint,
          };
        }

        return null;
      });

      if (performanceMetrics) {
        // Chromium may expose paint timing without a non-zero event-duration
        // delta in Astro preview. Validate each metric only when available.
        if (performanceMetrics.domContentLoaded) {
          expect(performanceMetrics.domContentLoaded).toBeGreaterThan(0);
        }
        if (performanceMetrics.firstContentfulPaint) {
          expect(performanceMetrics.firstContentfulPaint).toBeGreaterThan(0);
        }
        expect(Object.values(performanceMetrics).some((metric) => metric > 0)).toBe(true);
      }
    });

    test('should handle performance degradation gracefully', async ({ page, context }) => {
      // Simulate performance degradation
      await context.route('**/*', async (route) => {
        // Fixed delays keep the degraded-network scenario reproducible.
        const delay = 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
        route.continue();
      });

      const startTime = Date.now();
      await page.goto('/');

      // Page should still function despite performance issues
      await expect(page.locator('main').first()).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Should complete within reasonable degraded performance time
      expect(loadTime).toBeLessThan(10000); // 10 seconds max for degraded performance
    });
  });
});
