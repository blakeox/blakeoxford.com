import { test, expect } from '@playwright/test';

// Blog pages
test.describe('Blog pages', () => {
  test('Blog index shows published posts', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
    // Example published post
    await expect(page.getByRole('link', { name: 'Hello World' })).toBeVisible();
  });

  test('Individual blog post page renders correctly', async ({ page }) => {
    await page.goto('/blog/hello-world/');
    // Title and date
    await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible();
    await expect(page.locator('time')).toContainText('May');
    // Content area uses prose class
    await expect(page.locator('article.prose')).toBeVisible();
  });
});

// Projects pages
test.describe('Projects pages', () => {
  test('Projects index shows non-draft and featured projects', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    // Featured project link
    await expect(page.getByRole('link', { name: 'Enterprise Digital Transformation' })).toBeVisible();
    // Back to Projects link should not appear on index
    expect(await page.getByRole('link', { name: 'Back to Projects' }).count()).toBe(0);
  });

  test('Project detail page displays content and navigation', async ({ page }) => {
    const slug = 'enterprise-digital-transformation';
    await page.goto(`/projects/${slug}/`);
    // Hero and title
    await expect(page.getByRole('heading', { name: 'Enterprise Digital Transformation' })).toBeVisible();
    // Body content
    await expect(page.locator('article.prose')).toBeVisible();
    // Prev/Next navigation
    await expect(page.getByRole('link', { name: /Back to Projects/ })).toBeVisible();
  });
});