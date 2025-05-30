import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the site title and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /blake oxford/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Blog', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
  });
});

test.describe('About Page', () => {
  test('should display about page content', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /blake oxford/i, level: 1 })).toBeVisible();
    // Fix: Only check the main content area for text
    const aboutMain = page.locator('main.flex-1');
    await expect(aboutMain).toContainText(/blake oxford/i);
  });
});

test.describe('Contact Page', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: /let's connect/i })).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('404 Page', () => {
  test('should show 404 for non-existent route', async ({ page }) => {
    await page.goto('/thispagedoesnotexist', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/404/i)).toBeVisible();
  });
});
