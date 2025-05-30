import { test, expect } from '@playwright/test';

const slug = 'enterprise-digital-transformation';
const base = `/projects/${slug}/`;

test.describe('Project Detail Page', () => {
  test('renders hero title and date', async ({ page }) => {
    await page.goto(base);
    await expect(page.getByRole('heading', { name: 'Enterprise Digital Transformation' })).toBeVisible();
    await expect(page.getByText('January 2024')).toBeVisible();
  });

  test('shows project body content', async ({ page }) => {
    await page.goto(base);
    await expect(page.locator('article.prose')).toContainText('This project involved a complete overhaul of legacy systems');
  });

  test('shows tags and correct count', async ({ page }) => {
    await page.goto(base);
    const tags = page.locator('aside ul li');
    await expect(tags).toHaveCount(3);
    const aside = page.locator('aside');
    await expect(aside.getByRole('link', { name: 'Cloud' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'SaaS' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Automation' })).toBeVisible();
  });

  test('has back to projects link', async ({ page }) => {
    await page.goto(base);
    await expect(page.getByRole('link', { name: 'Back to Projects' })).toBeVisible();
  });
});