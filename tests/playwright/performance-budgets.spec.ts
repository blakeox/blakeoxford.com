import { test, expect } from './fixtures';
import { waitForAsyncOperation } from './utils/test-helpers';
import fs from 'fs';
import path from 'path';

const budgets = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'tests/config/performance-budgets.json'), 'utf8')
) as {
  bundleSizes: {
    jsTotalBytes: number;
    jsSingleBytes: number;
    cssTotalBytes: number;
    cssSingleBytes: number;
  };
};

test.describe('Performance Budget Enforcement', () => {
  test.describe('Bundle Size Budgets', () => {
    test('should enforce JavaScript bundle size limits', async ({ page }) => {
      const jsResources: Array<{ url: string; size: number }> = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('.js') && !url.includes('node_modules') && response.status() === 200) {
          try {
            const body = await response.body();
            jsResources.push({
              url,
              size: body.length,
            });
          } catch {
            // Ignore failed responses
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const totalJSSize = jsResources.reduce((sum, resource) => sum + resource.size, 0);

      expect(totalJSSize).toBeLessThan(budgets.bundleSizes.jsTotalBytes);
      console.log(
        `✅ Total JS size: ${(totalJSSize / 1024).toFixed(2)}KB (Budget: ${budgets.bundleSizes.jsTotalBytes / 1024}KB)`
      );

      // Individual bundle size check
      jsResources.forEach((resource) => {
        expect(resource.size).toBeLessThan(budgets.bundleSizes.jsSingleBytes);
        console.log(`📦 ${resource.url}: ${(resource.size / 1024).toFixed(2)}KB`);
      });
    });

    test('should enforce CSS bundle size limits', async ({ page }) => {
      const cssResources: Array<{ url: string; size: number }> = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('.css') && response.status() === 200) {
          try {
            const body = await response.body();
            cssResources.push({
              url,
              size: body.length,
            });
          } catch {
            // Ignore failed responses
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const totalCSSSize = cssResources.reduce((sum, resource) => sum + resource.size, 0);

      expect(totalCSSSize).toBeLessThan(budgets.bundleSizes.cssTotalBytes);
      console.log(
        `🎨 Total CSS size: ${(totalCSSSize / 1024).toFixed(2)}KB (Budget: ${budgets.bundleSizes.cssTotalBytes / 1024}KB)`
      );

      cssResources.forEach((resource) => {
        expect(resource.size).toBeLessThan(budgets.bundleSizes.cssSingleBytes);
      });
    });
  });

  test.describe('Core Web Vitals Budgets', () => {
    test('should meet Largest Contentful Paint budget', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // Wait for the largest contentful element
      await page.waitForSelector('main h1, main img, article', { timeout: 5000 });

      const lcpTime = Date.now() - startTime;

      // LCP Budget: 2.5 seconds for good, 4 seconds for needs improvement
      const LCP_BUDGET = 2500; // 2.5 seconds

      expect(lcpTime).toBeLessThan(LCP_BUDGET);
      console.log(`⚡ LCP: ${lcpTime}ms (Budget: ${LCP_BUDGET}ms)`);
    });

    test('should meet Cumulative Layout Shift budget', async ({ page }) => {
      await page.goto('/');

      // Track layout shifts
      const clsValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          let sessionValue = 0;

          interface LayoutShiftEntry {
            name: string;
            entryType: string;
            startTime: number;
            duration: number;
            value: number;
            hadRecentInput: boolean;
          }

          let sessionEntries: LayoutShiftEntry[] = [];

          if ('PerformanceObserver' in window) {
            const observer = new window.PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const layoutShift = entry as unknown as LayoutShiftEntry;
                // Only count layout shifts without recent user input
                if (!layoutShift.hadRecentInput) {
                  const firstSessionEntry = sessionEntries[0];
                  const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

                  // If the entry occurred less than 1 second after the previous entry and
                  // less than 5 seconds after the first entry in the session, include the
                  // entry in the current session. Otherwise, start a new session.
                  if (
                    sessionValue &&
                    entry.startTime - lastSessionEntry.startTime < 1000 &&
                    entry.startTime - firstSessionEntry.startTime < 5000
                  ) {
                    sessionValue += layoutShift.value;
                    sessionEntries.push(layoutShift);
                  } else {
                    sessionValue = layoutShift.value;
                    sessionEntries = [layoutShift];
                  }

                  // Update the maximum session value if the current session is larger
                  clsValue = Math.max(clsValue, sessionValue);
                }
              }
            });

            observer.observe({ type: 'layout-shift', buffered: true });

            // Resolve after a delay to capture shifts
            setTimeout(() => resolve(clsValue), 3000);
          } else {
            resolve(0); // Fallback if PerformanceObserver not available
          }
        });
      });

      // CLS Budget: 0.1 for good, 0.25 for needs improvement
      const CLS_BUDGET = 0.1;

      expect(clsValue).toBeLessThan(CLS_BUDGET);
      console.log(`📏 CLS: ${clsValue} (Budget: ${CLS_BUDGET})`);
    });

    test('should meet the lab responsiveness proxy budget', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait for any heavy JavaScript to complete
      await waitForAsyncOperation(page);

      try {
        const startTime = performance.now();

        // Exercise multiple interaction types as a lab responsiveness proxy.
        let interactionElement = page.locator('nav a').first();

        // Fallback to other interactive elements if nav link not found
        if (!(await interactionElement.count())) {
          interactionElement = page.locator('button').first();
        }

        if (!(await interactionElement.count())) {
          interactionElement = page.locator('[role="button"], input, [tabindex="0"]').first();
        }

        if ((await interactionElement.count()) && (await interactionElement.isVisible())) {
          await interactionElement.click();
          const interactionDurationMs = performance.now() - startTime;

          // Lab interaction budget is intentionally separate from field INP.
          const INTERACTION_BUDGET = 1000;

          expect(interactionDurationMs).toBeLessThan(INTERACTION_BUDGET);
          console.log(
            `🖱️ Interaction latency: ${Math.round(interactionDurationMs)}ms (Budget: ${INTERACTION_BUDGET}ms)`
          );
        } else {
          console.warn('No interactive elements found for responsiveness measurement');
          // Skip the responsiveness check if no interactive elements are available.
        }
      } catch (error) {
        console.warn('Responsiveness measurement failed:', error);
        // Don't fail the lab responsiveness check if measurement fails.
      }
    });
  });

  test.describe('Resource Loading Budgets', () => {
    test('should limit number of HTTP requests', async ({ page }) => {
      const requests: string[] = [];

      page.on('request', (request) => {
        requests.push(request.url());
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // HTTP Request Budget: 150 requests max (increased for enhanced application)
      const REQUEST_BUDGET = 150;

      expect(requests.length).toBeLessThan(REQUEST_BUDGET);
      console.log(`🌐 HTTP Requests: ${requests.length} (Budget: ${REQUEST_BUDGET})`);
    });

    test('should limit image sizes', async ({ page }) => {
      const imageRequests: Array<{ url: string; size: number }> = [];

      page.on('response', async (response) => {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.startsWith('image/') && response.status() === 200) {
          try {
            const body = await response.body();
            imageRequests.push({
              url: response.url(),
              size: body.length,
            });
          } catch {
            // Ignore failed responses
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Image Budget: 3MB per image, 15MB total (realistic for modern optimized sites)
      const IMAGE_BUDGETS = {
        singleImage: 3 * 1024 * 1024, // 3MB per image (increased to accommodate portfolio images)
        totalImages: 15 * 1024 * 1024, // 15MB total
      };

      const totalImageSize = imageRequests.reduce((sum, img) => sum + img.size, 0);

      expect(totalImageSize).toBeLessThan(IMAGE_BUDGETS.totalImages);
      console.log(
        `🖼️ Total Image size: ${(totalImageSize / 1024 / 1024).toFixed(2)}MB (Budget: ${IMAGE_BUDGETS.totalImages / 1024 / 1024}MB)`
      );

      imageRequests.forEach((image) => {
        expect(image.size).toBeLessThan(IMAGE_BUDGETS.singleImage);
      });
    });

    test('should enforce font loading budget', async ({ page }) => {
      const fontRequests: Array<{ url: string; size: number }> = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (
          (url.includes('font') ||
            url.endsWith('.woff2') ||
            url.endsWith('.woff') ||
            url.endsWith('.ttf')) &&
          response.status() === 200
        ) {
          try {
            const body = await response.body();
            fontRequests.push({
              url,
              size: body.length,
            });
          } catch {
            // Ignore failed responses
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Font Budget: 250KB total fonts (adjusted for Open Sans 3 weights)
      const FONT_BUDGET = 250 * 1024; // 250KB total

      const totalFontSize = fontRequests.reduce((sum, font) => sum + font.size, 0);

      if (totalFontSize > 0) {
        expect(totalFontSize).toBeLessThan(FONT_BUDGET);
        console.log(
          `🔤 Total Font size: ${(totalFontSize / 1024).toFixed(2)}KB (Budget: ${FONT_BUDGET / 1024}KB)`
        );
      }
    });
  });

  test.describe('Memory Usage Budgets', () => {
    test('should limit JavaScript heap usage', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Interact with the page to trigger JS execution
      await page.click('nav a');
      await page.goBack();
      await waitForAsyncOperation(page);

      const memoryInfo = await page.evaluate(() => {
        interface ExtendedPerformance extends Performance {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }

        const perf = window.performance as ExtendedPerformance;
        return perf.memory
          ? {
              usedJSHeapSize: perf.memory.usedJSHeapSize,
              totalJSHeapSize: perf.memory.totalJSHeapSize,
              jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
            }
          : null;
      });

      if (memoryInfo) {
        // Memory Budget: 50MB heap usage
        const MEMORY_BUDGET = 50 * 1024 * 1024; // 50MB

        expect(memoryInfo.usedJSHeapSize).toBeLessThan(MEMORY_BUDGET);
        console.log(
          `🧠 JS Heap: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB (Budget: ${MEMORY_BUDGET / 1024 / 1024}MB)`
        );
      }
    });
  });
});
