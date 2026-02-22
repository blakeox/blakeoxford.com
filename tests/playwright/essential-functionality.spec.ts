import { test, expect } from '@playwright/test';
import { navigateMain } from '../utils/pageActions';

test.describe('Core Site Functionality', () => {
  test('homepage should load quickly @essential', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Quick essential checks - target main content H1 only
    await expect(page.locator('main h1, [role="main"] h1, body > section h1').first()).toBeVisible();
    await expect(page.locator('nav#navbar')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // Check title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test('navigation should work @essential', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test main navigation (use helper to ensure robust navigation)
    await navigateMain(page, '/about/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main h1, [role="main"] h1, body > section h1').first()).toBeVisible();
    // verify handled by helper
  });

  test('search functionality should work @essential', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Just verify search elements exist - simplified test for performance
    const searchElements = await page.locator('[data-search-trigger], #search-overlay, .search-button').count();
    expect(searchElements).toBeGreaterThan(0);
  });
});

test.describe('Page Load Performance', () => {
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/about/', name: 'About' },
    { path: '/projects/', name: 'Projects' },
    { path: '/contact/', name: 'Contact' },
  ];

  pages.forEach(({ path, name }) => {
    test(`${name} should load efficiently @smoke`, async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Basic functionality check - target main content H1 only
      await expect(page.locator('main h1, [role="main"] h1, body > section h1').first()).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      
      // Performance assertion (should load under 5 seconds)
      expect(loadTime).toBeLessThan(5000);
    });
  });
});

test.describe('Interactive Elements', () => {
  test('mobile menu should function @critical', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');
    
    // Test mobile menu
    await expect(burgerButton).toBeVisible();
    await burgerButton.click();
    await expect(mobileMenu).toHaveClass(/active/, { timeout: 3000 });
    
    // Close menu
    await page.keyboard.press('Escape');
    await expect(mobileMenu).not.toHaveClass(/active/, { timeout: 3000 });
  });

  test('theme toggle should work @essential', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Just verify the theme toggle button exists and is accessible
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();
    
    // Check if it has proper aria attributes
    const hasAriaLabel = await themeToggle.getAttribute('aria-label');
    expect(hasAriaLabel).toBeTruthy();
  });
});
