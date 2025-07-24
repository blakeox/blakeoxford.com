import { test, expect } from '@playwright/test';

/**
 * Core Accessibility Test Suite
 * 
 * This file contains the most essential accessibility tests that should always pass.
 * More detailed accessibility tests are split into separate files:
 * - wcag-compliance.spec.ts
 * - keyboard-navigation.spec.ts  
 * - screen-reader.spec.ts
 * - form-accessibility.spec.ts
 */

test.describe('Core Accessibility Tests', () => {
  test('homepage should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Essential checks that should never fail
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test('all pages should have basic accessibility structure', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      
      // Critical accessibility requirements
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBeTruthy();
      
      await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main, [role="main"]')).toBeVisible();
    }
  });
});
