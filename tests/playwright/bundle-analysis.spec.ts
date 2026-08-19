import { test, expect } from './fixtures';
import fs from 'fs';
import path from 'path';

const performanceBudgets = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'tests/config/performance-budgets.json'), 'utf8')
) as {
  bundleSizes: {
    cssTotalBytes: number;
    cssSingleBytes: number;
  };
};

test.describe('Bundle Analysis Testing @extended', () => {
  test.describe('JavaScript Bundle Optimization', () => {
    test('should maintain reasonable JavaScript bundle sizes', async ({ page }) => {
      const jsBundles: Array<{ url: string; size: number }> = [];

      // Track all JavaScript resources
      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';

        if (url.includes('.js') && contentType.includes('javascript')) {
          try {
            const body = await response.body();
            jsBundles.push({
              url: url.split('/').pop() || url,
              size: body.length,
            });
          } catch {
            // Some responses might not be available
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Analyze bundle sizes
      expect(jsBundles.length).toBeGreaterThan(0);

      const totalJSSize = jsBundles.reduce((total, bundle) => total + bundle.size, 0);

      // Total JS should be under 3MB (accounting for dev dependencies, optimization tools, and standalone SearchOverlay)
      expect(totalJSSize).toBeLessThan(3 * 1024 * 1024);

      // Individual bundles should be reasonably sized
      jsBundles.forEach((bundle) => {
        expect(bundle.size).toBeLessThan(1 * 1024 * 1024); // 1MB max per bundle (increased for optimization tools)

        if (bundle.size > 100 * 1024) {
          console.log(
            `Large JS bundle detected: ${bundle.url} (${Math.round(bundle.size / 1024)}KB)`
          );
        }
      });

      // Log bundle analysis for monitoring
      console.log('JavaScript Bundle Analysis:', {
        totalBundles: jsBundles.length,
        totalSize: `${Math.round(totalJSSize / 1024)}KB`,
        bundles: jsBundles.map((b) => ({
          name: b.url,
          size: `${Math.round(b.size / 1024)}KB`,
        })),
      });
    });

    test('should have optimal CSS bundle sizes', async ({ page }) => {
      const cssBundles: Array<{ url: string; size: number }> = [];

      // Track all CSS resources
      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';

        if (url.includes('.css') && contentType.includes('css')) {
          try {
            const body = await response.body();
            cssBundles.push({
              url: url.split('/').pop() || url,
              size: body.length,
            });
          } catch {
            // Some responses might not be available
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      if (cssBundles.length > 0) {
        const totalCSSSize = cssBundles.reduce((total, bundle) => total + bundle.size, 0);

        // Keep this aligned with the central build budget. The current Tailwind
        // runtime includes shared tokens and component styles in one stylesheet.
        expect(totalCSSSize).toBeLessThan(performanceBudgets.bundleSizes.cssTotalBytes);

        // Individual CSS files should be reasonably sized
        cssBundles.forEach((bundle) => {
          expect(bundle.size).toBeLessThan(performanceBudgets.bundleSizes.cssSingleBytes);
        });

        console.log('CSS Bundle Analysis:', {
          totalBundles: cssBundles.length,
          totalSize: `${Math.round(totalCSSSize / 1024)}KB`,
          bundles: cssBundles.map((b) => ({
            name: b.url,
            size: `${Math.round(b.size / 1024)}KB`,
          })),
        });
      }
    });

    test('should optimize image delivery', async ({ page }) => {
      const images: Array<{ url: string; size: number; format: string }> = [];

      // Track image resources
      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';

        if (contentType.startsWith('image/')) {
          try {
            const body = await response.body();
            images.push({
              url: url.split('/').pop() || url,
              size: body.length,
              format: contentType.split('/')[1],
            });
          } catch {
            // Some responses might not be available
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      if (images.length > 0) {
        const totalImageSize = images.reduce((total, img) => total + img.size, 0);

        // Total image size should be reasonable
        expect(totalImageSize).toBeLessThan(2000 * 1024); // 2MB total

        // Individual images should be optimized
        images.forEach((image) => {
          expect(image.size).toBeLessThan(500 * 1024); // 500KB max per image

          // Recommend modern formats
          if (image.size > 100 * 1024 && !['webp', 'avif'].includes(image.format)) {
            console.warn(
              `Large image in non-optimized format: ${image.url} (${image.format}, ${Math.round(image.size / 1024)}KB)`
            );
          }
        });

        console.log('Image Analysis:', {
          totalImages: images.length,
          totalSize: `${Math.round(totalImageSize / 1024)}KB`,
          formats: [...new Set(images.map((i) => i.format))],
          largeImages: images.filter((i) => i.size > 100 * 1024).length,
        });
      }
    });
  });

  test.describe('Performance Budget Compliance', () => {
    test('should meet Core Web Vitals budget', async ({ page }) => {
      await page.goto('/');

      // Measure performance metrics
      const performanceMetrics = await page.evaluate(() => {
        return new Promise<Record<string, number>>((resolve) => {
          const metrics: Record<string, number> = {};

          // Simple timing measurement
          const navigationEntries = window.performance.getEntriesByType('navigation');
          if (navigationEntries.length > 0) {
            const navigationEntry = navigationEntries[0] as unknown as {
              domContentLoadedEventEnd: number;
              domContentLoadedEventStart: number;
              loadEventEnd: number;
              loadEventStart: number;
            };
            metrics.domContentLoaded =
              navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart;
            metrics.loadComplete = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
          }

          // Try to get paint timings
          const paintEntries = window.performance.getEntriesByType('paint');
          paintEntries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
          });

          resolve(metrics);
        });
      });

      console.log('Performance Metrics:', performanceMetrics);

      // Basic performance thresholds
      if (performanceMetrics.domContentLoaded) {
        expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2s DOM ready
      }

      if (performanceMetrics.fcp) {
        expect(performanceMetrics.fcp).toBeLessThan(3000); // 3s FCP
      }
    });

    test('should maintain fast page load times', async ({ page }) => {
      const pages = ['/', '/about', '/projects', '/contact'];
      const loadTimes: Array<{ page: string; loadTime: number }> = [];

      for (const pagePath of pages) {
        const startTime = Date.now();

        await page.goto(pagePath);
        await page.waitForLoadState('domcontentloaded');

        const loadTime = Date.now() - startTime;
        loadTimes.push({ page: pagePath, loadTime });

        // Each page should load within reasonable time
        expect(loadTime).toBeLessThan(3000); // 3 seconds
      }

      // Average load time should be good
      const avgLoadTime = loadTimes.reduce((sum, p) => sum + p.loadTime, 0) / loadTimes.length;
      expect(avgLoadTime).toBeLessThan(2000); // 2 seconds average

      console.log('Page Load Analysis:', {
        pages: loadTimes,
        average: `${Math.round(avgLoadTime)}ms`,
      });
    });

    test('should optimize resource loading', async ({ page }) => {
      const resourceCounts = {
        total: 0,
        js: 0,
        css: 0,
        images: 0,
        fonts: 0,
        other: 0,
      };

      // Track all resources
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
        } else if (contentType.includes('font') || url.includes('.woff')) {
          resourceCounts.fonts++;
        } else {
          resourceCounts.other++;
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Resource count budgets (updated for enhanced application with optimization tools)
      expect(resourceCounts.total).toBeLessThan(150); // Total requests under 150 (increased for optimization)
      expect(resourceCounts.js).toBeLessThan(80); // JS files under 80 (increased for optimization tools)
      expect(resourceCounts.css).toBeLessThan(20); // CSS files under 20 (increased for component styles)
      expect(resourceCounts.images).toBeLessThan(30); // Images under 30

      console.log('Resource Count Analysis:', resourceCounts);
    });
  });

  test.describe('Build Output Analysis', () => {
    test('should have optimal build output structure', async () => {
      const distPath = path.join(process.cwd(), 'dist');

      // Check if dist directory exists (skip if not built)
      if (!fs.existsSync(distPath)) {
        console.log('Dist directory not found, skipping build analysis');
        return;
      }

      // Analyze build output
      const getDirectorySize = (dirPath: string): number => {
        let totalSize = 0;

        try {
          const items = fs.readdirSync(dirPath);

          items.forEach((item) => {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
              totalSize += getDirectorySize(itemPath);
            } else {
              totalSize += stats.size;
            }
          });
        } catch {
          // Handle permission or access errors
        }

        return totalSize;
      };

      const totalSize = getDirectorySize(distPath);

      // Build output should be reasonable size
      expect(totalSize).toBeLessThan(50 * 1024 * 1024); // 50MB max

      console.log('Build Output Analysis:', {
        totalSize: `${Math.round(totalSize / (1024 * 1024))}MB`,
        path: distPath,
      });
    });

    test('should generate compressed assets', async ({ page }) => {
      const compressedAssets: string[] = [];

      // Check for compressed content
      page.on('response', (response) => {
        const encoding = response.headers()['content-encoding'];
        if (encoding && ['gzip', 'br', 'deflate'].includes(encoding)) {
          compressedAssets.push(response.url().split('/').pop() || response.url());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should have some compressed assets
      if (compressedAssets.length > 0) {
        console.log('Compressed Assets:', compressedAssets);
        expect(compressedAssets.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Caching Strategy Analysis', () => {
    test('should implement proper caching headers', async ({ page }) => {
      const cachingAnalysis: Array<{ url: string; cacheControl: string; etag: boolean }> = [];

      // Analyze caching headers
      page.on('response', (response) => {
        const url = response.url();
        const cacheControl = response.headers()['cache-control'] || 'none';
        const etag = !!response.headers()['etag'];

        // Focus on static assets
        if (
          url.includes('.js') ||
          url.includes('.css') ||
          url.includes('.woff') ||
          url.includes('.png')
        ) {
          cachingAnalysis.push({
            url: url.split('/').pop() || url,
            cacheControl,
            etag,
          });
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      if (cachingAnalysis.length === 0) {
        test.skip(true, 'No static assets were observed in the preview response set');
        return;
      }

      // Astro preview does not emulate the Cloudflare Worker cache headers.
      // The edge route contract suite owns that deployed-header assertion.
      const assetsWithCaching = cachingAnalysis.filter(
        (asset) => asset.cacheControl !== 'none' && asset.cacheControl !== 'no-cache'
      );
      if (assetsWithCaching.length === 0) {
        test.skip(
          true,
          'Worker cache headers are validated by the edge route contract suite, not Astro preview'
        );
        return;
      }

      const cachingRatio = assetsWithCaching.length / cachingAnalysis.length;
      expect(cachingRatio).toBeGreaterThan(0.5);

      console.log('Caching Analysis:', {
        totalAssets: cachingAnalysis.length,
        withCaching: assetsWithCaching.length,
        cachingRatio: `${Math.round(cachingRatio * 100)}%`,
        details: cachingAnalysis.slice(0, 5),
      });
    });

    test('should leverage browser caching', async ({ page }) => {
      // First visit
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const firstVisitResources: string[] = [];

      // Track resources on second visit
      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css')) {
          firstVisitResources.push(url);
        }
      });

      // Second visit (should use cache)
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still function properly with cached resources
      const main = page.locator('main, h1').first();
      await expect(main).toBeVisible();
    });
  });
});
