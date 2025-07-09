import { test, expect } from '@playwright/test';

test.describe('Chaos Engineering Tests', () => {
  test.describe('Network Resilience', () => {
    test('should handle random network failures gracefully', async ({ page, context }) => {
      // Randomly fail 20% of requests to simulate unstable network
      await context.route('**/*', (route) => {
        const shouldFail = Math.random() < 0.2;
        
        if (shouldFail && !route.request().url().includes('.html')) {
          route.abort('connectionfailed');
        } else {
          route.continue();
        }
      });
      
      await page.goto('/');
      
      // Page should still load and be functional
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // Basic navigation should work
      const aboutLink = page.getByRole('link', { name: /about/i });
      if (await aboutLink.isVisible()) {
        await aboutLink.click();
        await expect(page.locator('main')).toBeVisible();
      }
      
      console.log('✅ Site remains functional with 20% network failure rate');
    });

    test('should handle slow network gracefully', async ({ page, context }) => {
      // Add random delays to simulate slow network
      await context.route('**/*', async (route) => {
        const delay = Math.random() * 2000; // 0-2 second delay
        await new Promise(resolve => setTimeout(resolve, delay));
        route.continue();
      });
      
      const startTime = Date.now();
      await page.goto('/');
      
      // Should eventually load even with slow network
      await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Site loaded in ${loadTime}ms with network chaos`);
      
      // Basic functionality should still work
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should handle intermittent API failures', async ({ page, context }) => {
      let apiCallCount = 0;
      
      // Fail every third API call
      await context.route('**/api/**', (route) => {
        apiCallCount++;
        
        if (apiCallCount % 3 === 0) {
          route.fulfill({ 
            status: 500, 
            body: JSON.stringify({ error: 'Simulated API failure' })
          });
        } else {
          route.continue();
        }
      });
      
      await page.goto('/blog');
      
      // Page should handle API failures gracefully
      await expect(page.locator('main')).toBeVisible();
      
      // Should show error state or fallback content
      const hasContent = await page.locator('article, .blog-post, .error-message').count() > 0;
      expect(hasContent).toBe(true);
      
      console.log('✅ API failures handled gracefully');
    });
  });

  test.describe('Resource Chaos', () => {
    test('should handle missing CSS gracefully', async ({ page, context }) => {
      // Block CSS files randomly
      await context.route('**/*.css', (route) => {
        if (Math.random() < 0.5) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await page.goto('/');
      
      // Content should still be accessible even without styles
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // Navigation should still work
      const links = page.locator('nav a');
      if (await links.count() > 0) {
        await expect(links.first()).toBeVisible();
      }
      
      console.log('✅ Site functional without some CSS');
    });

    test('should handle missing JavaScript gracefully', async ({ page, context }) => {
      // Block non-critical JavaScript files
      await context.route('**/*.js', (route) => {
        const url = route.request().url();
        
        // Don't block critical framework files
        if (url.includes('astro') || url.includes('framework')) {
          route.continue();
        } else if (Math.random() < 0.3) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await page.goto('/');
      
      // Basic functionality should work
      await expect(page.locator('main')).toBeVisible();
      
      // Navigation should work
      await page.getByRole('link', { name: /about/i }).click();
      await expect(page).toHaveURL(/about/);
      
      console.log('✅ Site functional without some JavaScript');
    });

    test('should handle font loading failures', async ({ page, context }) => {
      // Block font files
      await context.route('**/*.woff*', route => route.abort('failed'));
      await context.route('**/*.ttf', route => route.abort('failed'));
      await context.route('**/fonts.googleapis.com/**', route => route.abort('failed'));
      
      await page.goto('/');
      
      // Page should load with fallback fonts
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      
      // Text should still be readable
      const h1Text = await page.locator('h1').first().textContent();
      expect(h1Text?.trim()).toBeTruthy();
      
      console.log('✅ Site readable with fallback fonts');
    });
  });

  test.describe('User Input Chaos', () => {
    test('should handle rapid user interactions', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Rapidly click navigation elements
      const navLinks = page.locator('nav a');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        // Rapid fire clicks
        await navLinks.nth(i).click();
        await page.waitForTimeout(100);
        
        if (i % 2 === 0) {
          await page.goBack();
          await page.waitForTimeout(100);
        }
      }
      
      // Page should still be responsive
      await expect(page.locator('main')).toBeVisible();
      
      console.log('✅ Site handles rapid interactions');
    });

    test('should handle invalid form inputs', async ({ page }) => {
      await page.goto('/contact');
      
      const form = page.locator('#contact-form');
      if (await form.isVisible()) {
        // Try various invalid inputs
        const chaosInputs = [
          '<script>alert("xss")</script>',
          'a'.repeat(10000), // Very long string
          '../../etc/passwd',
          'DROP TABLE users;',
          '\u0000\u0001\u0002', // Control characters
          'mailto:test@example.com',
          'javascript:void(0)',
        ];
        
        const nameField = page.locator('#name');
        const emailField = page.locator('#email');
        const messageField = page.locator('#message');
        
        for (const input of chaosInputs) {
          if (await nameField.isVisible()) {
            await nameField.fill(input);
          }
          if (await emailField.isVisible()) {
            await emailField.fill(input);
          }
          if (await messageField.isVisible()) {
            await messageField.fill(input);
          }
          
          // Try to submit
          const submitButton = page.locator('button[type="submit"]');
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(500);
          }
          
          // Form should handle invalid input gracefully
          await expect(form).toBeVisible();
        }
      }
      
      console.log('✅ Form handles malicious inputs safely');
    });

    test('should handle keyboard chaos', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Random keyboard mashing
      const chaosKeys = [
        'Tab', 'Shift+Tab', 'Enter', 'Escape', 'Space',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Home', 'End', 'PageUp', 'PageDown',
        'Control+a', 'Control+c', 'Control+v', 'Control+z'
      ];
      
      for (let i = 0; i < 20; i++) {
        const randomKey = chaosKeys[Math.floor(Math.random() * chaosKeys.length)];
        await page.keyboard.press(randomKey);
        await page.waitForTimeout(50);
      }
      
      // Page should still be functional
      await expect(page.locator('main')).toBeVisible();
      
      // Navigation should still work
      await page.getByRole('link', { name: /about/i }).click();
      await expect(page).toHaveURL(/about/);
      
      console.log('✅ Site survives keyboard chaos');
    });
  });

  test.describe('Performance Chaos', () => {
    test('should handle high CPU load simulation', async ({ page }) => {
      await page.goto('/');
      
      // Simulate high CPU load
      await page.evaluate(() => {
        // Create CPU-intensive computation directly
        const startTime = Date.now();
        let result = 0;
        
        // Run CPU-intensive operation for 2 seconds
        const computeHeavy = () => {
          const endTime = Date.now() + 1000; // 1 second
          while (Date.now() < endTime) {
            result += Math.random() * Math.random();
          }
        };
        
        // Start heavy computation
        computeHeavy();
        
        return result;
      });
      
      // Page should remain responsive
      await page.waitForTimeout(1000);
      
      // Basic interactions should still work
      const aboutLink = page.getByRole('link', { name: /about/i });
      await aboutLink.click();
      await expect(page).toHaveURL(/about/);
      
      console.log('✅ Site remains responsive under CPU load');
    });

    test('should handle memory pressure', async ({ page }) => {
      await page.goto('/');
      
      // Create memory pressure
      await page.evaluate(() => {
        const largeArrays: number[][] = [];
        
        // Allocate large arrays
        for (let i = 0; i < 10; i++) {
          const arr = new Array(100000).fill(Math.random());
          largeArrays.push(arr);
        }
        
        // Clean up after test
        setTimeout(() => {
          largeArrays.length = 0;
        }, 3000);
      });
      
      await page.waitForTimeout(1000);
      
      // Navigation should still work
      await page.getByRole('link', { name: /projects/i }).click();
      await expect(page).toHaveURL(/projects/);
      
      console.log('✅ Site handles memory pressure gracefully');
    });
  });

  test.describe('Browser Chaos', () => {
    test('should handle viewport chaos', async ({ page }) => {
      await page.goto('/');
      
      // Rapidly change viewport sizes
      const viewports = [
        { width: 320, height: 568 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }, // Desktop
        { width: 414, height: 896 },   // Mobile landscape
        { width: 1024, height: 768 },  // Tablet landscape
      ];
      
      for (let i = 0; i < 10; i++) {
        const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
        await page.setViewportSize(randomViewport);
        await page.waitForTimeout(200);
        
        // Content should remain accessible
        await expect(page.locator('main')).toBeVisible();
      }
      
      console.log('✅ Site handles viewport chaos');
    });

    test('should handle zoom chaos', async ({ page }) => {
      await page.goto('/');
      
      // Simulate different zoom levels by changing viewport
      const zoomLevels = [
        { width: 1920, height: 1080 }, // 100%
        { width: 960, height: 540 },   // 200%
        { width: 640, height: 360 },   // 300%
        { width: 480, height: 270 },   // 400%
      ];
      
      for (const zoom of zoomLevels) {
        await page.setViewportSize(zoom);
        await page.waitForTimeout(500);
        
        // Content should remain usable
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('nav')).toBeVisible();
      }
      
      console.log('✅ Site remains usable at different zoom levels');
    });
  });

  test.describe('Content Chaos', () => {
    test('should handle malformed API responses', async ({ page, context }) => {
      // Return malformed JSON randomly
      await context.route('**/api/**', (route) => {
        if (Math.random() < 0.3) {
          route.fulfill({
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: '{"invalid": json malformed}'
          });
        } else {
          route.continue();
        }
      });
      
      await page.goto('/blog');
      
      // Should handle malformed responses gracefully
      await expect(page.locator('main')).toBeVisible();
      
      // Should not crash the page
      const hasValidContent = await page.locator('body').isVisible();
      expect(hasValidContent).toBe(true);
      
      console.log('✅ Site handles malformed API responses');
    });

    test('should handle missing content gracefully', async ({ page, context }) => {
      // Return empty responses sometimes
      await context.route('**/api/**', (route) => {
        if (Math.random() < 0.5) {
          route.fulfill({
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: '[]'
          });
        } else {
          route.continue();
        }
      });
      
      await page.goto('/projects');
      
      // Should show empty state or fallback content
      await expect(page.locator('main')).toBeVisible();
      
      // Navigation should still work
      await page.getByRole('link', { name: /home|about/i }).first().click();
      await expect(page.locator('main')).toBeVisible();
      
      console.log('✅ Site handles empty content gracefully');
    });
  });
});
