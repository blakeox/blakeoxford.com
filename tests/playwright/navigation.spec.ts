import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/');
    // Navigate to About
    await Promise.all([
      page.waitForURL(/.*about/),
      page.getByRole('link', { name: 'About', exact: true }).click(),
    ]);
    // Navigate to Blog
    await Promise.all([
      page.waitForURL(/.*blog/),
      page.getByRole('link', { name: 'Blog', exact: true }).click(),
    ]);
    // Navigate to Projects
    await Promise.all([
      page.waitForURL(/.*projects/),
      page.getByRole('link', { name: 'Projects', exact: true }).click(),
    ]);
    // Navigate to Contact
    await Promise.all([
      page.waitForURL(/.*contact/),
      page.getByRole('link', { name: 'Contact', exact: true }).click(),
    ]);
  });
});
