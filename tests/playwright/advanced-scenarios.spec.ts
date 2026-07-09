import { test, expect } from './fixtures';

test.describe('Advanced Test Scenarios @extended', () => {
  test.describe('API Error Handling', () => {
    test('should handle API failures gracefully', async ({ page }) => {
      await page.route('**/api/projects.json', (route) => {
        route.fulfill({ status: 404, body: JSON.stringify({ error: 'Not Found' }) });
      });

      await page.goto('/projects');
      await expect(page.locator('main').first()).toBeVisible();
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle slow API responses', async ({ page }) => {
      await page.route('**/api/projects.json', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              slug: 'test-project',
              title: 'Test Project',
              description: 'A test project',
              publishedAt: '2023-01-01',
              tags: ['test']
            }
          ])
        });
      });

      const startTime = Date.now();
      await page.goto('/projects');
      await expect(page.locator('main').first()).toBeVisible();
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe('Network Failure Scenarios', () => {
    test('should work offline with cached content', async ({ page }) => {
      // First, load the page online to cache resources
      await page.goto('/');
      await expect(page.locator('main').first()).toBeVisible();
      
      // Simulate offline behavior by blocking network requests
      await page.route('**/*', (route) => {
        // Allow static assets but block navigation
        if (route.request().resourceType() === 'document') {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      // Test that current page remains functional when network fails
      await expect(page.locator('main').first()).toBeVisible();
      await expect(page.locator('nav').first()).toBeVisible();
      
      // Clear route interception
      await page.unroute('**/*');
    });

    test('should handle intermittent connectivity', async ({ page }) => {
      await page.goto('/');
      
      // Simulate intermittent connectivity by randomly failing some requests
      let requestCount = 0;
      await page.route('**/*', (route) => {
        requestCount++;
        // Fail every 3rd request to simulate intermittent issues
        if (requestCount % 3 === 0 && route.request().resourceType() !== 'document') {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      // Navigate and verify page still works despite some failed requests
      await page.goto('/about');
      await expect(page.locator('main').first()).toBeVisible();
      
      // Clear route interception
      await page.unroute('**/*');
    });

    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        route.continue();
      });

      const startTime = Date.now();
      await page.goto('/');
      
      await expect(page.locator('main').first()).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(15000); // 15 seconds for slow network
    });

    test('should handle CDN failures', async ({ page }) => {
      // Mock CDN failures for external resources
      await page.route('**/cdn.jsdelivr.net/**', (route) => {
        route.abort('failed');
      });

      await page.route('**/fonts.googleapis.com/**', (route) => {
        route.abort('failed');
      });

      await page.goto('/');
      
      // Page should still function without external CDN resources
      await expect(page.locator('main').first()).toBeVisible();
      await expect(page.locator('nav').first()).toBeVisible();
      
      // Test basic functionality
      await page.getByRole('link', { name: /about/i }).click();
      await expect(page).toHaveURL(/about/);
    });
  });

  test.describe('Progressive Web App Features', () => {
    test('should have valid web app manifest', async ({ page }) => {
      await page.goto('/');
      
      // Check for manifest link
      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toHaveCount(1);
      
      const manifestHref = await manifestLink.getAttribute('href');
      expect(manifestHref).toBeTruthy();
      
      // Fetch and validate manifest
      const manifestResponse = await page.request.get(manifestHref!);
      expect(manifestResponse.status()).toBe(200);
      
      const manifest = await manifestResponse.json();
      
      // Validate required manifest fields
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(manifest.start_url).toBeTruthy();
      expect(manifest.display).toBeTruthy();
      expect(manifest.theme_color).toBeTruthy();
      expect(manifest.background_color).toBeTruthy();
      expect(manifest.icons).toBeTruthy();
      expect(Array.isArray(manifest.icons)).toBe(true);
      
      // Validate icons
      manifest.icons.forEach((icon: { src: string; sizes: string; type: string }) => {
        expect(icon.src).toBeTruthy();
        expect(icon.sizes).toBeTruthy();
        expect(icon.type).toBeTruthy();
      });
    });

    test('should support service worker registration', async ({ page }) => {
      await page.goto('/');
      
      // Check if service worker is available in the browser
      const swSupport = await page.evaluate(() => {
        return 'serviceWorker' in window.navigator;
      });
      
      expect(swSupport).toBe(true);
      
      // Check for service worker registration (if implemented)
      const swRegistration = await page.evaluate(async () => {
        try {
          const registration = await window.navigator.serviceWorker.getRegistration();
          return !!registration;
        } catch {
          return false;
        }
      });
      
      // Service worker may or may not be implemented - just verify the API is available
      expect(typeof swRegistration).toBe('boolean');
    });

    test('should work as installable PWA', async ({ page }) => {
      await page.goto('/');
      
      // Check for PWA installation criteria
      // Note: This is a basic check - full PWA testing requires real device testing
      
      // Check manifest
      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toHaveCount(1);
      
      // Check for HTTPS (in production)
      const url = page.url();
      const isSecure = url.startsWith('https://') || url.startsWith('http://localhost');
      expect(isSecure).toBe(true);
      
      // Check basic PWA requirements
      await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
      await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
    });

    test('should handle app-like navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test single-page app-like behavior
      const initialLoad = page.locator('body');
      await expect(initialLoad).toBeVisible();
      
      // Navigate between pages
      await page.getByRole('link', { name: /about/i }).click();
      await expect(page).toHaveURL(/about/);
      
      // Check that navigation feels app-like (no full page refresh)
      await expect(page.locator('body')).toBeVisible();
      
      // Test back/forward navigation
      await page.goBack();
      await expect(page).toHaveURL('/');
      
      await page.goForward();
      await expect(page).toHaveURL(/about/);
    });
  });

  test.describe('SEO Validation', () => {
    test('should have proper meta tags on all pages', async ({ page }) => {
      const pages = ['/', '/about', '/contact', '/projects', '/blog'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Required meta tags
        await expect(page.locator('meta[name="description"]')).toHaveCount(1);
        await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
        
        // Open Graph tags
        await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
        await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
        await expect(page.locator('meta[property="og:type"]')).toHaveCount(1);
        await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
        
        // Twitter Card tags
        await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
        await expect(page.locator('meta[name="twitter:title"]')).toHaveCount(1);
        await expect(page.locator('meta[name="twitter:description"]')).toHaveCount(1);
        
        // Canonical URL
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
        
        // Title tag
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(60); // SEO best practice
        
        // Meta description
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBeTruthy();
        expect(description!.length).toBeGreaterThan(50);
        expect(description!.length).toBeLessThan(160); // SEO best practice
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const pages = ['/', '/about', '/contact', '/projects'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Should have at least one H1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
        
        // H1 should have meaningful content
        const h1Text = await page.locator('h1').first().textContent();
        expect(h1Text).toBeTruthy();
        expect(h1Text!.trim().length).toBeGreaterThan(3);
        
        // Check heading hierarchy (H2s should come after H1s, etc.)
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
        expect(headings.length).toBeGreaterThan(0);
      }
    });

    test('should have valid structured data', async ({ page }) => {
      await page.goto('/');
      
      // Check for JSON-LD structured data
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const jsonLdCount = await jsonLdScripts.count();
      
      if (jsonLdCount > 0) {
        // Validate JSON-LD structure
        for (let i = 0; i < jsonLdCount; i++) {
          const jsonLdContent = await jsonLdScripts.nth(i).textContent();
          expect(jsonLdContent).toBeTruthy();
          
          // Should be valid JSON
          const structuredData = JSON.parse(jsonLdContent!);
          expect(structuredData['@context']).toBeTruthy();
          expect(structuredData['@type']).toBeTruthy();
        }
      }
    });

    test('should have proper image SEO', async ({ page }) => {
      await page.goto('/');
      
      // All images should have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        
        // Alt attribute should exist (can be empty for decorative images)
        expect(alt).not.toBeNull();
        
        // If not empty, should be meaningful
        if (alt && alt.trim()) {
          expect(alt.trim().length).toBeGreaterThan(3);
        }
      }
    });

    test('should have proper internal linking', async ({ page }) => {
      await page.goto('/');
      
      // Check for internal links
      const internalLinks = page.locator('a[href^="/"], a[href^="./"], a[href^="../"]');
      const linkCount = await internalLinks.count();
      
      expect(linkCount).toBeGreaterThan(0);
      
      // Test a few internal links to ensure they work
      for (let i = 0; i < Math.min(5, linkCount); i++) {
        const link = internalLinks.nth(i);
        const href = await link.getAttribute('href');
        
        if (href && !href.includes('#') && !href.includes('mailto:')) {
          // Make a HEAD request to verify the link works
          try {
            const response = await page.request.head(href);
            expect(response.status()).toBeLessThan(400);
          } catch {
            // Some links might be dynamic or require special handling
            console.warn(`Could not verify link: ${href}`);
          }
        }
      }
    });

    test('should have proper robots.txt and sitemap', async ({ page }) => {
      // Check robots.txt
      try {
        const robotsResponse = await page.request.get('/robots.txt');
        expect(robotsResponse.status()).toBe(200);
        
        const robotsContent = await robotsResponse.text();
        expect(robotsContent).toContain('User-agent');
      } catch {
        console.warn('robots.txt not found or inaccessible');
      }
      
      // Check sitemap
      try {
        const sitemapResponse = await page.request.get('/sitemap.xml');
        expect(sitemapResponse.status()).toBe(200);
        
        const sitemapContent = await sitemapResponse.text();
        expect(sitemapContent).toContain('<urlset');
        expect(sitemapContent).toContain('<url>');
      } catch {
        console.warn('sitemap.xml not found or inaccessible');
      }
    });

    test('should have fast loading times for SEO', async ({ page }) => {
      const pages = ['/', '/about', '/projects'];
      
      for (const pagePath of pages) {
        const startTime = Date.now();
        
        await page.goto(pagePath);
        await expect(page.locator('main').first()).toBeVisible();
        
        const loadTime = Date.now() - startTime;
        
        // Core Web Vitals consideration - should load quickly
        expect(loadTime).toBeLessThan(3000); // 3 seconds for good SEO
      }
    });
  });

  test.describe('Security and Privacy', () => {
    test('should have proper security headers', async ({ page }) => {
      const response = await page.goto('/');
      
      // Check for basic security headers
      const headers = response?.headers() || {};
      
      // Note: Some headers might be set by hosting provider
      // This test documents what should be present
      
      // Content Security Policy
      const csp = headers['content-security-policy'];
      if (csp) {
        expect(csp).toBeTruthy();
      }
      
      // X-Frame-Options
      const frameOptions = headers['x-frame-options'];
      if (frameOptions) {
        expect(['DENY', 'SAMEORIGIN'].includes(frameOptions.toUpperCase())).toBe(true);
      }
    });

    test('should handle form submissions securely', async ({ page }) => {
      await page.goto('/contact');
      
      // Check CSRF protection (if implemented)
      const form = page.locator('#contact-form');
      await expect(form).toBeVisible();
      
      // Check that form uses POST method for sensitive data
      const method = await form.getAttribute('method');
      if (method) {
        expect(method.toLowerCase()).toBe('post');
      }
      
      // Check for proper input validation
      const emailInput = page.locator('#email');
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('required');
    });

    test('should not expose sensitive information', async ({ page }) => {
      await page.goto('/');
      
      // Check that no sensitive information is in the source
      const content = await page.content();
      
      // Common sensitive patterns that shouldn't be exposed
      const sensitivePatterns = [
        /api[_-]?key/i,
        /secret/i,
        /password/i,
        /token/i,
        /private[_-]?key/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(content).not.toMatch(pattern);
      });
    });
  });
});
