import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/about/"]');
    await expect(page).toHaveURL(/.*about/);
    await page.click('a[href="/blog/"]');
    await expect(page).toHaveURL(/.*blog/);
    await page.click('a[href="/projects/"]');
    await expect(page).toHaveURL(/.*projects/);
    await page.click('a[href="/contact/"]');
    await expect(page).toHaveURL(/.*contact/);
  });
});
