import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

// Lightweight, scoped accessibility checks for the About page timeline
// Tags: @essential @timeline @accessibility

test.describe('@essential @timeline @accessibility About Timeline - Axe scan', () => {
  test('has no critical a11y violations in timeline section (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    // Ensure the timeline section and heading are present
    await expect(page.locator('section#about-timeline')).toBeVisible();
    await expect(page.getByRole('heading', { name: /professional journey/i })).toBeVisible();

    // Scope Axe to the timeline section to keep this fast and stable
    const results = await new AxeBuilder({ page })
      .include('section#about-timeline')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Optionally filter out known dynamic color tokens if needed
    const violations = results.violations.filter(v => !['color-contrast'].includes(v.id));

    expect.soft(violations).toEqual([]);
  });

  test('has no critical a11y violations in timeline section (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('section#about-timeline')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('section#about-timeline')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const violations = results.violations.filter(v => !['color-contrast'].includes(v.id));

    expect.soft(violations).toEqual([]);
  });
});
