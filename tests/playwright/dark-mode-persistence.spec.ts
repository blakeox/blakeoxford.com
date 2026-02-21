import { test, expect } from '@playwright/test';

test.describe('Dark mode persistence', () => {
  test('persists theme across navigation and reloads', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#theme-toggle');

    const toggle = page.locator('#theme-toggle');
    await toggle.click();

    // Expect HTML to reflect dark theme via data-theme and class
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Navigate to another page and expect theme to persist
    await page.goto('/about');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Hard reload and expect persistence
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Cookie should be set for server-side personalization
    const cookies = await page.context().cookies();
    const themeCookie = cookies.find(c => c.name === 'theme');
    expect(themeCookie).toBeTruthy();
    expect(themeCookie?.value).toBe('dark');
  });
});
