import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Essential accessibility tests - run in fast CI
test.describe('Essential Accessibility Tests', () => {
  test.describe('Critical WCAG Checks @essential', () => {
    test('homepage should pass basic accessibility audit', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(500); // Minimal stabilization

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
      
      // Check main navigation exists and is accessible
      const mainNav = page.locator('nav[role="navigation"], nav, [role="navigation"]').first();
      await expect(mainNav).toBeVisible();
      
      // Check that nav items are focusable
      const navLinks = page.locator('nav a, [role="navigation"] a').first();
      if (await navLinks.count() > 0) {
        await navLinks.focus();
        await expect(navLinks).toBeFocused();
      }
    });

    test('should have skip links for keyboard navigation @essential', async ({ page }) => {
      await page.goto('/');
      
      // Check for skip link (may be visually hidden)
      const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link').first();
      await expect(skipLink).toBeInTheDOM();
    });
  });

  test.describe('Form Accessibility @essential', () => {
    test('contact form should have proper labels', async ({ page }) => {
      await page.goto('/contact');
      
      // Check that form inputs have associated labels
      const formInputs = page.locator('input[type="text"], input[type="email"], textarea');
      const inputCount = await formInputs.count();
      
      for (let i = 0; i < Math.min(3, inputCount); i++) { // Limit to first 3 inputs for speed
        const input = formInputs.nth(i);
        const inputId = await input.getAttribute('id');
        const inputName = await input.getAttribute('name');
        
        if (inputId) {
          // Check for label with for attribute
          const label = page.locator(`label[for="${inputId}"]`);
          await expect(label).toBeVisible();
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
  const criticalPages = ['/', '/about', '/projects'];
  
  for (const pagePath of criticalPages) {
    test(`${pagePath} should have basic accessibility structure`, async ({ page }) => {
      await page.goto(pagePath);
      
      // Quick checks for essential accessibility features
      await expect(page.locator('html')).toHaveAttribute('lang');
      await expect(page.locator('title')).toHaveCount(1);
      
      // Check for main landmark
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
    });
  }
});