import { test, expect } from '@playwright/test';

// Essential navigation tests - run in fast CI
test.describe('Essential Navigation Tests', () => {
  test.describe('Critical Navigation @essential', () => {
    test('should navigate between main pages', async ({ page }) => {
      // Start at homepage
      await page.goto('/');
      await expect(page).toHaveTitle(/Blake Oxford/);
      
      // Navigate to About
      await page.click('nav a[href="/about"], a[href="/about"]');
      await expect(page).toHaveURL(/.*\/about/);
      
      // Navigate to Projects
      await page.click('nav a[href="/projects"], a[href="/projects"]');
      await expect(page).toHaveURL(/.*\/projects/);
      
      // Navigate back to Home
      await page.click('nav a[href="/"], a[href="/"]');
      await expect(page).toHaveURL(/.*\//);
    });

    test('should have working logo/home link @essential', async ({ page }) => {
      await page.goto('/about');
      
      // Click logo or site title to return home
      const homeLink = page.locator('header a[href="/"], .logo a, h1 a, .site-title a').first();
      await homeLink.click();
      
      await expect(page).toHaveURL(/.*\/$/);
    });

    test('main navigation should be visible and accessible @essential', async ({ page }) => {
      await page.goto('/');
      
      // Check main navigation exists
      const mainNav = page.locator('nav, [role="navigation"]').first();
      await expect(mainNav).toBeVisible();
      
      // Check for essential navigation links
      await expect(page.locator('nav a[href="/"], nav a[href="/about"], nav a[href="/projects"]')).toHaveCount(3, { timeout: 10000 });
    });
  });

  test.describe('Page Load Tests @smoke', () => {
    const criticalPages = [
      { path: '/', title: /Blake Oxford|Home/ },
      { path: '/about', title: /About|Blake Oxford/ },
      { path: '/projects', title: /Projects|Blake Oxford/ },
      { path: '/contact', title: /Contact|Blake Oxford/ },
    ];

    for (const { path, title } of criticalPages) {
      test(`${path} should load successfully`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveTitle(title);
        
        // Check page has main content
        const main = page.locator('main, [role="main"], .main-content').first();
        await expect(main).toBeVisible();
      });
    }
  });

  test.describe('Mobile Navigation @critical', () => {
    test('mobile menu should work on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Look for mobile menu toggle
      const mobileToggle = page.locator('.mobile-menu-toggle, .menu-toggle, button[aria-label*="menu"], button[aria-label*="Menu"]').first();
      
      if (await mobileToggle.count() > 0) {
        await mobileToggle.click();
        
        // Check if mobile menu is visible
        const mobileMenu = page.locator('.mobile-menu, .menu-mobile, nav[aria-expanded="true"]').first();
        await expect(mobileMenu).toBeVisible();
      }
    });
  });
});