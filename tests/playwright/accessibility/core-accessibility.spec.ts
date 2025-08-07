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
    
    // Essential checks that should never fail - target main content H1 only
    await expect(page.locator('main h1, [role="main"] h1, body > * h1').first()).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    await expect(page.locator('nav[role="navigation"]').first()).toBeVisible(); // Take first nav element
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

    test('blog page should be accessible', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('main h1, [role="main"] h1, body > * h1').first()).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    await expect(page.locator('nav[role="navigation"]').first()).toBeVisible(); // Take first nav element
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test('projects page should be accessible', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('main h1, [role="main"] h1, body > * h1').first()).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    await expect(page.locator('nav[role="navigation"]').first()).toBeVisible(); // Take first nav element
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });
});
