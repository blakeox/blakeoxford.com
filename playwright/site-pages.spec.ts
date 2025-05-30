import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the site title and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /blake oxford/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /blog/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
  });
});

test.describe('About Page', () => {
  test('should display about page content', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.getByRole('heading', { name: /about/i })).toBeVisible();
    await expect(page.locator('main')).toContainText(/blake oxford/i);
  });
});

test.describe('Contact Page', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: /contact/i })).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('404 Page', () => {
  test('should show 404 for non-existent route', async ({ page }) => {
    await page.goto('/thispagedoesnotexist', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/404/i)).toBeVisible();
  });
});
