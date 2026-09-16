import { test, expect } from '../fixtures';

test.describe('home hero identity', () => {
  test('shows both theses and two actions in the first viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('[data-home-dual]');
    await expect(hero.locator('[data-dual-line-work]')).toBeVisible();
    await expect(hero.locator('[data-dual-line-daring]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start a conversation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'See the work' }).first()).toBeVisible();

    const fitsViewport = await hero.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 1;
    });
    expect(fitsViewport).toBe(true);
  });

  test('keeps both identity lines readable when motion is reduced', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('[data-home-dual]');
    await expect(hero).toHaveAttribute('data-side', 'both');
    await expect(hero.locator('[data-dual-line-work]')).toBeVisible();
    await expect(hero.locator('[data-dual-line-daring]')).toBeVisible();
  });
});
