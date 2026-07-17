import { test, expect } from './fixtures';

test.describe('NavBar hydration on Contact page', () => {
  test('nav renders and essential controls are visible', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });

    // Main nav present
    const nav = page.locator('nav#navbar[role="navigation"]');
    await expect(nav).toBeVisible();

    // Search and theme toggles render
    await expect(page.locator('#search-toggle.search-toggle')).toBeVisible();
    await expect(page.locator('#theme-toggle.theme-toggle')).toBeVisible();

    // Brand/home link is present
    await expect(page.locator('.brand-link[href="/"]')).toBeVisible();
  });

  test('mobile menu toggles open/close', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });

    const toggle = page.locator('#nav-toggle.burger-menu-button');
    const menu = page.locator('#nav-mobile-links.mobile-menu');

    // Toggle should exist on mobile
    await expect(toggle).toBeVisible();

    // Menu initially hidden via visibility hidden or absence of .active
    await expect(menu).toBeVisible({ visible: false });

    // Open menu
    await toggle.click();
    await expect(menu).toHaveAttribute('data-state', 'open');

    // Close via keyboard (Escape) to avoid any pointer interception flake
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('data-state', 'closed');
  });
});
