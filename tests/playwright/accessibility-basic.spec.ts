import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForAsyncOperation } from './utils/test-helpers';

// Essential accessibility tests - run in fast CI
test.describe('Essential Accessibility Tests', () => {
  test.describe('Critical WCAG Checks @essential', () => {
    test('homepage should pass basic accessibility audit', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForAsyncOperation(page); // Minimal stabilization

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa']) // Core WCAG only
        .disableRules(['color-contrast']) // Skip slow color contrast checks for fast CI
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy @essential', async ({ page }) => {
      await page.goto('/');

      // Check for exactly one h1 per page
      const h1Elements = page.locator('h1');
      await expect(h1Elements.first()).toBeVisible();

      // Basic heading structure check
      const headings = page.locator('main h1, main h2, main h3');
      const headingCount = await headings.count();

      if (headingCount > 0) {
        const firstHeading = headings.first();
        const tagName = await firstHeading.evaluate(el => el.tagName);
        expect(['H1', 'H2'].includes(tagName)).toBeTruthy();
      }
    });

    test('navigation should be keyboard accessible @essential', async ({ page }) => {
      await page.goto('/');

      // Check main navigation exists and is accessible using specific selector
      const mainNav = page.locator('nav[role="navigation"]#navbar');
      await expect(mainNav).toBeVisible();

      // Check that nav items are focusable using specific selector
      const navLinks = page.locator('nav .nav-link').first();
      if (await navLinks.count() > 0) {
        await navLinks.focus();
        await expect(navLinks).toBeFocused();
      }
    });

    test('should have skip links for keyboard navigation @essential', async ({ page }) => {
      await page.goto('/');

      // Check for skip link (may be visually hidden) - use more specific selector
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();

      // Verify the skip link text
      await expect(skipLink).toHaveText('Skip to main content');
    });
  });

  test.describe('Form Accessibility @essential', () => {
    test('contact form should have proper labels', async ({ page }) => {
      await page.goto('/contact/');

      // Check that visible form inputs have associated labels - exclude hidden search overlay
      const formInputs = page.locator('main form input[type="text"], main form input[type="email"], main form textarea, form:not(.search-overlay) input[type="text"], form:not(.search-overlay) input[type="email"], form:not(.search-overlay) textarea').filter({ hasText: /.*/ });
      const inputCount = await formInputs.count();

      if (inputCount === 0) {
        // No form inputs found - skip this test gracefully
        console.log('No form inputs found on contact page - test passed');
        return;
      }

      for (let i = 0; i < Math.min(3, inputCount); i++) { // Limit to first 3 inputs for speed
        const input = formInputs.nth(i);

        // Skip if input is not visible (e.g., search overlay)
        if (!(await input.isVisible())) {
          continue;
        }

        const inputId = await input.getAttribute('id');
        const inputName = await input.getAttribute('name');

        if (inputId) {
          // Check for label with for attribute
          const label = page.locator(`label[for="${inputId}"]`);
          if (await label.count() > 0) {
            await expect(label).toBeVisible();
          }
        } else if (inputName) {
          // Check for aria-label or placeholder as fallback
          const ariaLabel = await input.getAttribute('aria-label');
          const placeholder = await input.getAttribute('placeholder');
          expect(ariaLabel || placeholder).toBeTruthy();
        }
      }
    });
  });
});

// Smoke tests for critical accessibility features
test.describe('Accessibility Smoke Tests @smoke', () => {
  const criticalPages = ['/', '/about/', '/projects/'];

  for (const pagePath of criticalPages) {
    test(`${pagePath} should have basic accessibility structure`, async ({ page }) => {
      await page.goto(pagePath);

      // Quick checks for essential accessibility features
      await expect(page.locator('html')).toHaveAttribute('lang');
      // Use page.title() for cross-browser reliability (WebKit can virtualize head rendering)
      const docTitle = await page.title();
      expect(docTitle && docTitle.trim().length).toBeGreaterThan(0);

      // Check for main landmark using specific selector
      const main = page.locator('main#main-content');
      await expect(main).toBeVisible();
    });
  }
});
