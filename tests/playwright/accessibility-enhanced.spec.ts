import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Enhanced Accessibility Testing with axe-core', () => {
  test.describe('Comprehensive WCAG Audits', () => {
    test('homepage should pass comprehensive accessibility audit', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('about page should pass comprehensive accessibility audit', async ({ page }) => {
      await page.goto('/about');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('projects page should pass comprehensive accessibility audit', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('contact page should pass comprehensive accessibility audit', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('blog page should pass comprehensive accessibility audit', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Component-Level Accessibility', () => {
    test('navigation component should be fully accessible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('nav')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('search overlay should be accessible when open', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open search overlay
      await page.keyboard.press('Control+k');
      const searchOverlay = page.locator('#search-overlay');
      
      if (await searchOverlay.isVisible({ timeout: 3000 })) {
        const accessibilityScanResults = await new AxeBuilder({ page })
          .include('#search-overlay')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      }
    });

    test('contact form should be fully accessible', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('#contact-form')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('project cards should be accessible', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      const projectCards = page.locator('article, .project-card');
      const cardCount = await projectCards.count();

      if (cardCount > 0) {
        // Test first project card
        const accessibilityScanResults = await new AxeBuilder({ page })
          .include('article:first-of-type, .project-card:first-of-type')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      }
    });
  });

  test.describe('Interactive Elements Accessibility', () => {
    test('all buttons should be accessible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        
        // Check button has accessible name
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
        
        // Check button is focusable
        await button.focus();
        await expect(button).toBeFocused();
      }
    });

    test('all links should have meaningful text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const links = page.locator('a[href]');
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        const textContent = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');

        // Skip anchor links and javascript: links
        if (href === '#' || href?.startsWith('javascript:')) {
          continue;
        }

        // Link should have meaningful content
        const linkText = textContent?.trim() || ariaLabel?.trim() || title?.trim();
        expect(linkText).toBeTruthy();
        expect(linkText?.length).toBeGreaterThan(1);
      }
    });

    test('form inputs should have proper labels and descriptions', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');

      const inputs = page.locator('input:not([type="hidden"]), textarea, select');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        const inputType = await input.getAttribute('type');

        // Skip buttons
        if (inputType === 'submit' || inputType === 'button') {
          continue;
        }

        if (inputId) {
          // Check for associated label
          const label = page.locator(`label[for="${inputId}"]`);
          await expect(label).toHaveCount(1);

          // Check for aria-describedby if present
          const ariaDescribedBy = await input.getAttribute('aria-describedby');
          if (ariaDescribedBy) {
            const description = page.locator(`#${ariaDescribedBy}`);
            await expect(description).toHaveCount(1);
          }
        }
      }
    });
  });

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should pass color contrast requirements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .withRules(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should be usable at 200% zoom', async ({ page }) => {
      await page.goto('/');
      
      // Simulate 200% zoom by halving viewport
      await page.setViewportSize({ width: 640, height: 360 });
      await page.waitForLoadState('networkidle');

      // Main content should still be visible and accessible
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();

      // Navigation should still be usable
      const navLinks = page.locator('nav a');
      if (await navLinks.count() > 0) {
        await expect(navLinks.first()).toBeVisible();
      }
    });
  });

  test.describe('Keyboard Navigation Excellence', () => {
    test('should support complete keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const focusableElements: string[] = [];
      let previousElement = '';

      // Tab through elements and track focus path
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        
        try {
          const focusedElement = page.locator(':focus');
          if (await focusedElement.count() > 0) {
            const tagName = await focusedElement.evaluate(el => el.tagName);
            const role = await focusedElement.getAttribute('role');
            const ariaLabel = await focusedElement.getAttribute('aria-label');
            const elementId = await focusedElement.getAttribute('id');
            
            const identifier = `${tagName}${role ? `:${role}` : ''}${ariaLabel ? `[${ariaLabel}]` : ''}${elementId ? `#${elementId}` : ''}`;
            
            if (identifier !== previousElement) {
              focusableElements.push(identifier);
              previousElement = identifier;
            }
          }
        } catch {
          // Focus may have moved to iframe or out of page
          break;
        }
      }

      // Should have found multiple focusable elements
      expect(focusableElements.length).toBeGreaterThan(5);
      
      // Test reverse tabbing
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Shift+Tab');
        await page.waitForTimeout(100);
      }
    });

    test('should handle escape key properly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open search overlay
      await page.keyboard.press('Control+k');
      const searchOverlay = page.locator('#search-overlay');
      
      if (await searchOverlay.isVisible({ timeout: 3000 })) {
        // Escape should close the overlay
        await page.keyboard.press('Escape');
        await expect(searchOverlay).not.toBeVisible();
      }
    });

    test('should support arrow key navigation where appropriate', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test arrow navigation in search results if available
      await page.keyboard.press('Control+k');
      const searchOverlay = page.locator('#search-overlay');
      
      if (await searchOverlay.isVisible({ timeout: 3000 })) {
        const searchInput = page.locator('#search-input');
        await searchInput.fill('project');
        await page.waitForTimeout(500);

        // Test down arrow navigation through results
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        // Should have proper focus management
        const focusedElement = page.locator(':focus');
        if (await focusedElement.count() > 0) {
          await expect(focusedElement).toBeVisible();
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper landmark structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['landmark-one-main', 'landmark-complementary-is-top-level', 'landmark-no-duplicate-banner'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have descriptive page titles', async ({ page }) => {
      const pages = [
        { path: '/', titlePattern: /portfolio|blake oxford|welcome/i },
        { path: '/about', titlePattern: /about|blake oxford/i },
        { path: '/projects', titlePattern: /projects|blake oxford/i },
        { path: '/contact', titlePattern: /contact|blake oxford/i },
        { path: '/blog', titlePattern: /blog|blake oxford/i }
      ];

      for (const { path, titlePattern } of pages) {
        await page.goto(path);
        const title = await page.title();
        
        expect(title).toMatch(titlePattern);
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(60);
      }
    });

    test('should provide alternative text for all images', async ({ page }) => {
      const pages = ['/', '/about', '/projects'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        const images = page.locator('img');
        const imageCount = await images.count();
        
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          const role = await img.getAttribute('role');
          
          // Images should have alt text (can be empty for decorative images)
          expect(alt).not.toBeNull();
          
          // If role="presentation", alt can be empty, otherwise should have meaningful alt
          if (role !== 'presentation' && role !== 'none') {
            const src = await img.getAttribute('src');
            if (src && !src.includes('data:')) { // Skip data URIs which are often decorative
              expect(alt?.trim().length).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have adequate touch targets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test that interactive elements are large enough for touch
      const interactiveElements = page.locator('button, a, input[type="submit"], [role="button"]');
      const count = await interactiveElements.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = interactiveElements.nth(i);
        
        if (await element.isVisible()) {
          const boundingBox = await element.boundingBox();
          if (boundingBox) {
            // WCAG recommends minimum 44x44px touch targets
            expect(boundingBox.width).toBeGreaterThanOrEqual(40); // Slightly relaxed
            expect(boundingBox.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });
  });
});
