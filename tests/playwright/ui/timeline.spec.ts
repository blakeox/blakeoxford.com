import { test, expect } from '../fixtures';

test.describe('@essential @timeline About Page - Timeline', () => {
  test('renders editorial track record with years', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    const section = page.locator('section#about-timeline');
    await expect(section).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /where the judgment was forged/i })
    ).toBeVisible();
    await expect(section).toContainText('2019');
    await expect(section).toContainText('2024');
    await expect(section.getByRole('list').first()).toBeVisible();
  });

  test('keeps track record readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    const section = page.locator('section#about-timeline');
    await expect(section).toBeVisible();
    await expect(section).toContainText('2019');
    await expect(section).toContainText('Cloud migration');
  });
});
