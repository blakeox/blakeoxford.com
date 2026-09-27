import { test, expect } from '../fixtures';

test.describe('home hero identity', () => {
  test('shows one sentence and two actions in the first viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('#about-me');
    await expect(hero.getByRole('heading', { name: 'Blake Oxford' })).toBeVisible();
    await expect(hero.getByText('Builds systems teams keep running.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Discuss your bottleneck' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'See the work' }).first()).toBeVisible();
    await expect(hero.locator('[data-dual-select]')).toHaveCount(0);

    const fitsViewport = await hero.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 1;
    });
    expect(fitsViewport).toBe(true);
  });
});
