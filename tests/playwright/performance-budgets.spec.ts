import { test, expect } from '@playwright/test';

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
              size: body.length
            });
          } catch {
            // Ignore failed responses
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Performance budgets (updated for enhanced application with optimization tools)
      const BUDGETS = {
        totalJS: 3 * 1024 * 1024, // 3MB total (increased for optimization tools)
        singleBundle: 1 * 1024 * 1024, // 1MB per bundle (increased for complex bundles)
        criticalJS: 500 * 1024, // 500KB for critical path (increased)
      };

      const totalJSSize = jsResources.reduce((sum, resource) => sum + resource.size, 0);
      
      expect(totalJSSize).toBeLessThan(BUDGETS.totalJS);
      console.log(`✅ Total JS size: ${(totalJSSize / 1024).toFixed(2)}KB (Budget: ${BUDGETS.totalJS / 1024}KB)`);

      // Individual bundle size check
      jsResources.forEach(resource => {
        expect(resource.size).toBeLessThan(BUDGETS.singleBundle);
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
              size: body.length
            });
          } catch {
            // Ignore failed responses
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const BUDGETS = {
        totalCSS: 200 * 1024, // 200KB total CSS (increased for component styles)
        singleStylesheet: 150 * 1024, // 150KB per stylesheet (increased)
      };

      const totalCSSSize = cssResources.reduce((sum, resource) => sum + resource.size, 0);
      
      expect(totalCSSSize).toBeLessThan(BUDGETS.totalCSS);
      console.log(`🎨 Total CSS size: ${(totalCSSSize / 1024).toFixed(2)}KB (Budget: ${BUDGETS.totalCSS / 1024}KB)`);

      cssResources.forEach(resource => {
        expect(resource.size).toBeLessThan(BUDGETS.singleStylesheet);
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
                  if (sessionValue &&
                      entry.startTime - lastSessionEntry.startTime < 1000 &&
                      entry.startTime - firstSessionEntry.startTime < 5000) {
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

    test('should meet First Input Delay budget', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for any heavy JavaScript to complete
      await page.waitForTimeout(500);
      
      const startTime = performance.now();
      
      // Simulate first user interaction with a more specific selector
      const navLink = page.locator('nav a').first();
      await navLink.click();
      
      const fidTime = performance.now() - startTime;
      
      // FID Budget: 500ms for test environment (more realistic for CI)
      const FID_BUDGET = 500;
      
      expect(fidTime).toBeLessThan(FID_BUDGET);
      console.log(`🖱️ FID: ${Math.round(fidTime)}ms (Budget: ${FID_BUDGET}ms)`);
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
              size: body.length
            });
          } catch {
            // Ignore failed responses
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Image Budget: 500KB per image, 2MB total
      const IMAGE_BUDGETS = {
        singleImage: 500 * 1024, // 500KB per image
        totalImages: 2 * 1024 * 1024, // 2MB total
      };

      const totalImageSize = imageRequests.reduce((sum, img) => sum + img.size, 0);
      
      expect(totalImageSize).toBeLessThan(IMAGE_BUDGETS.totalImages);
      console.log(`🖼️ Total Image size: ${(totalImageSize / 1024 / 1024).toFixed(2)}MB (Budget: ${IMAGE_BUDGETS.totalImages / 1024 / 1024}MB)`);

      imageRequests.forEach(image => {
        expect(image.size).toBeLessThan(IMAGE_BUDGETS.singleImage);
      });
    });

    test('should enforce font loading budget', async ({ page }) => {
      const fontRequests: Array<{ url: string; size: number }> = [];
      
      page.on('response', async (response) => {
        const url = response.url();
        if ((url.includes('font') || url.endsWith('.woff2') || url.endsWith('.woff') || url.endsWith('.ttf')) 
            && response.status() === 200) {
          try {
            const body = await response.body();
            fontRequests.push({
              url,
              size: body.length
            });
          } catch {
            // Ignore failed responses
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Font Budget: 200KB total fonts
      const FONT_BUDGET = 200 * 1024; // 200KB total
      
      const totalFontSize = fontRequests.reduce((sum, font) => sum + font.size, 0);
      
      if (totalFontSize > 0) {
        expect(totalFontSize).toBeLessThan(FONT_BUDGET);
        console.log(`🔤 Total Font size: ${(totalFontSize / 1024).toFixed(2)}KB (Budget: ${FONT_BUDGET / 1024}KB)`);
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
      await page.waitForTimeout(1000);

      const memoryInfo = await page.evaluate(() => {
        interface ExtendedPerformance extends Performance {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
        
        const perf = window.performance as ExtendedPerformance;
        return perf.memory ? {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
          jsHeapSizeLimit: perf.memory.jsHeapSizeLimit
        } : null;
      });

      if (memoryInfo) {
        // Memory Budget: 50MB heap usage
        const MEMORY_BUDGET = 50 * 1024 * 1024; // 50MB
        
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(MEMORY_BUDGET);
        console.log(`🧠 JS Heap: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB (Budget: ${MEMORY_BUDGET / 1024 / 1024}MB)`);
      }
    });
  });
});
