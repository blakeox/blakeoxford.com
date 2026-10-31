import { test, expect } from '../fixtures';

test.describe('@essential @timeline About Page - Timeline', () => {
  test('renders editorial track record with years', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    const section = page.locator('section#about-timeline');
    await expect(section).toBeVisible();
    await expect(page.locator('#about-timeline-heading')).toBeVisible();
    await expect(section).toContainText('2019');
    await expect(section).toContainText('2024');
    await expect(
      section.getByRole('heading', { name: 'Helping companies navigate AI', exact: true })
    ).toBeVisible();
    await expect(
      section.getByRole('heading', { name: 'Scaling AI across the enterprise', exact: true })
    ).toBeVisible();
    await expect(section).toContainText('2025');
    await expect(section).toContainText('2026');
    await expect(
      page.getByRole('list', { name: 'Practical capabilities' }).getByRole('listitem')
    ).toHaveCount(8);
    await expect(section.getByRole('list').first()).toBeVisible();
  });

  test('keeps track record readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    const section = page.locator('section#about-timeline');
    await expect(section).toBeVisible();
    await expect(section).toContainText('2019');
    await expect(section).toContainText('Cloud platforms and endpoints');
    await expect(section).toContainText('2025');
    await expect(section).toContainText('2026');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
  });
});
