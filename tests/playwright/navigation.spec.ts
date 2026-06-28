import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to About
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await page.waitForURL(/.*about/, { timeout: 10000 });
    await expect(page.locator('main h1, h1:has-text("wisdom"), h1:has-text("about")').first()).toBeVisible();
    
    // Navigate to Blog
    await page.getByRole('link', { name: 'Blog', exact: true }).click();
    await page.waitForURL(/.*blog/, { timeout: 10000 });
    await expect(page.locator('main h1, h1:has-text("blog")').first()).toBeVisible();
    
    // Navigate to Projects
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await page.waitForURL(/.*projects/, { timeout: 10000 });
    await expect(page.locator('main h1, h1:has-text("projects")').first()).toBeVisible();
    
    // Navigate to Contact
    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    await page.waitForURL(/.*contact/, { timeout: 10000 });
    await expect(page.locator('main h1, h1:has-text("contact")').first()).toBeVisible();
  });
});
