import { test, expect } from '../fixtures';

test.describe('@essential About photo story', () => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`keeps three captioned photographs readable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/about/');
      const story = page.locator('.about-photo-story');
      await expect(story.locator('figure')).toHaveCount(3);
      for (const image of await story.getByRole('img').all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
          .toBeGreaterThan(0);
        await expect(image).not.toHaveAttribute('alt', '');
      }
      await expect(story.locator('figcaption')).toHaveCount(3);
      const tower = story.getByRole('img', { name: /outdoor tower walkway/ });
      await expect(tower).toBeVisible();
      const towerBounds = await tower.boundingBox();
      expect(towerBounds!.height / towerBounds!.width).toBeCloseTo(4 / 3, 1);
      await expect(story).toContainText('Above the city · China');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      expect(await story.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    });
  }

  test('keeps photographs and captions available with reduced motion and no JavaScript', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      reducedMotion: 'reduce',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto('http://localhost:4330/about/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.about-photo-story figcaption')).toHaveCount(3);
    await expect(
      page.getByRole('link', { name: 'Discuss your bottleneck', exact: true }).first()
    ).toHaveAttribute('href', '/contact/');
    await context.close();
  });
});
