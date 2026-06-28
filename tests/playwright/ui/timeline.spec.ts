import { test, expect } from '../fixtures';

test.describe('@essential @timeline About Page - Timeline', () => {
  test('renders desktop timeline at >= md breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    // Section and heading should be present
    await expect(page.locator('section#about-timeline')).toBeVisible();
    await expect(page.getByRole('heading', { name: /professional journey/i })).toBeVisible();

    // Desktop timeline container should be visible (Tailwind: hidden md:block)
    const desktopTimeline = page.locator('section#about-timeline div.hidden.md\\:block');
    await expect(desktopTimeline).toBeVisible();

    // Mobile timeline container should be hidden at desktop sizes
    const mobileTimeline = page.locator('section#about-timeline .timeline-scroll-container');
    await expect(mobileTimeline).toBeHidden();

    // Ensure timeline items render (check for known years)
    await expect(page.locator('section#about-timeline')).toContainText('2019');
    await expect(page.locator('section#about-timeline')).toContainText('2024');
  });

  test('renders mobile timeline at < md breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    // Section and heading should be present
    await expect(page.locator('section#about-timeline')).toBeVisible();
    await expect(page.getByRole('heading', { name: /professional journey/i })).toBeVisible();

    // Desktop timeline container should be hidden at mobile sizes
    const desktopTimeline = page.locator('section#about-timeline div.hidden.md\\:block');
    await expect(desktopTimeline).toBeHidden();

    // Mobile timeline container should be visible
    const mobileTimeline = page.locator('section#about-timeline .timeline-scroll-container');
    await expect(mobileTimeline).toBeVisible();

    // Ensure items present in mobile scroller as well
    await expect(mobileTimeline).toContainText('2019');
  });
});
