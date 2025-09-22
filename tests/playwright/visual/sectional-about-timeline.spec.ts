import { test, expect } from '@playwright/test';

// Small, stable visual snapshot around the timeline header and first two cards
// Tags: @visual-essential @timeline

test.describe('@visual-essential @timeline About Timeline - Sectional Visual', () => {
  test('timeline header is visually stable (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });

    // Masking not required for header-only snapshot

    // Scroll to timeline header
    const timelineSection = page.locator('section#about-timeline');
    await timelineSection.scrollIntoViewIfNeeded();
    await expect(timelineSection).toBeVisible();

    // Snapshot just the header region to keep diffs minimal and avoid animation noise
    const header = page.getByRole('heading', { name: /professional journey/i });
    await expect(header).toBeVisible();
    await header.scrollIntoViewIfNeeded();

    const image = await header.screenshot({ animations: 'disabled' });
    expect(image).toMatchSnapshot('about-timeline-header.png', { maxDiffPixelRatio: 0.02 });
  });
});
