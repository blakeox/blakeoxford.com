import { test, expect } from '../fixtures';

// Small, stable visual snapshot around the timeline header and first two cards
// Tags: @visual-essential @timeline

test.describe('@extended @timeline About Timeline - Sectional Visual', () => {
  test('timeline header is visually stable (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    // Masking not required for header-only snapshot

    // Scroll to timeline header
    const timelineSection = page.locator('section#about-timeline');
    await timelineSection.scrollIntoViewIfNeeded();
    await expect(timelineSection).toBeVisible();

    // Snapshot just the header region to keep diffs minimal and avoid animation noise
    const header = page.locator('#about-timeline-heading');
    await expect(header).toBeVisible();
    await header.scrollIntoViewIfNeeded();

    await expect(header).toHaveScreenshot('about-timeline-header.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});
