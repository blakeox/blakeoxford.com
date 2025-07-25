import { test, expect } from '@playwright/test';

// Essential navigation tests - run in fast CI
test.describe('Essential Navigation Tests', () => {
  test.describe('Critical Navigation @essential', () => {
    test('should navigate between main pages', async ({ page }) => {
      // Start at homepage
      await page.goto('/');
      await expect(page).toHaveTitle(/Blake Oxford/);
      
      // Navigate to About
      await page.click('nav a[href="/about/"]');
      await expect(page).toHaveURL(/.*\/about\//);
      
      // Navigate to Projects
      await page.click('nav a[href="/projects/"]');
      await expect(page).toHaveURL(/.*\/projects\//);
      
      // Navigate back to Home
      await page.click('nav a[href="/"]');
      await expect(page).toHaveURL(/.*\/$/);
    });

    test('should have working logo/home link @essential', async ({ page }) => {
      await page.goto('/about');
      
      // Click brand/logo link to return home - use specific selector from NavBar.astro
      const homeLink = page.locator('.brand-link[href="/"]');
      await homeLink.click();
      
      await expect(page).toHaveURL(/.*\/$/);
    });

    test('main navigation should be visible and accessible @essential', async ({ page }) => {
      // Set desktop viewport to ensure desktop navigation is visible
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/');
      
      // Wait for navigation to be present
      await page.waitForSelector('nav[role="navigation"]#navbar');
      
      // Check main navigation exists using specific selector from NavBar
      const mainNav = page.locator('nav[role="navigation"]#navbar');
      await expect(mainNav).toBeVisible();
      
      // Wait for desktop navigation to be visible 
      await page.waitForSelector('.desktop-nav', { state: 'visible' });
      
      // Check for essential navigation links using the exact selectors from the rendered HTML
      const aboutLink = page.locator('.desktop-nav a.nav-link[href="/about/"]');
      const projectsLink = page.locator('.desktop-nav a.nav-link[href="/projects/"]');
      const homeLink = page.locator('.brand-link[href="/"]'); // Home link is the brand/logo link
      
      await expect(aboutLink).toBeVisible();
      await expect(projectsLink).toBeVisible();
      await expect(homeLink).toBeVisible();
    });
  });

  test.describe('Page Load Tests @smoke', () => {
    const criticalPages = [
      { path: '/', title: /Blake Oxford|Home/ },
      { path: '/about/', title: /About|Blake Oxford/ },
      { path: '/projects/', title: /Projects|Blake Oxford/ },
      { path: '/contact/', title: /Contact|Blake Oxford/ },
    ];

    for (const { path, title } of criticalPages) {
      test(`${path} should load successfully`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveTitle(title);
        
        // Check page has main content using specific selector
        const main = page.locator('main#main-content');
        await expect(main).toBeVisible();
      });
    }
  });

  test.describe('Mobile Navigation @critical', () => {
    test('mobile menu should work on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Look for mobile menu toggle using specific selector from NavBar
      const mobileToggle = page.locator('#nav-toggle.burger-menu-button');
      
      if (await mobileToggle.count() > 0) {
        await mobileToggle.click();
        
        // Check if mobile menu is visible using specific selector
        const mobileMenu = page.locator('#nav-mobile-links.mobile-menu');
        await expect(mobileMenu).toBeVisible();
      }
    });
  });
});