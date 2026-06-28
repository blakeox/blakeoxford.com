import { test, expect } from './fixtures';

test.describe('Dark mode persistence', () => {
  test('persists theme across navigation and reloads @essential', async ({ page }) => {
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

    // Prefer server cookie, but fall back to client-side localStorage if server cookie isn't present in this environment
    const cookies = await page.context().cookies();
    const themeCookie = cookies.find(c => c.name === 'theme');
    if (themeCookie) {
      expect(themeCookie?.value).toBe('dark');
    } else {
      const lsTheme = await page.evaluate(() => localStorage.getItem('theme'));
      expect(lsTheme).toBe('dark');
    }
  });
});
