import { test, expect } from '../fixtures';

test.describe('home hero identity', () => {
  test('shows both theses and two actions in the first viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('[data-home-dual]');
    await expect(hero.locator('[data-dual-line-work]')).toBeVisible();
    await expect(hero.locator('[data-dual-line-daring]')).toBeVisible();
    await expect(hero.getByRole('button', { name: 'Work', exact: true })).toBeVisible();
    await expect(hero.getByRole('button', { name: 'Daring', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Discuss your bottleneck' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'See the work' }).first()).toBeVisible();

    await hero.getByRole('button', { name: 'Daring', exact: true }).click();
    await expect(hero).toHaveAttribute('data-side', 'daring');

    const fitsViewport = await hero.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 1;
    });
    expect(fitsViewport).toBe(true);
  });

  test('commits Daring as the portrait leaves the first viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('[data-home-dual]');
    await expect(hero).toHaveAttribute('data-side', 'work');
    await page.evaluate(() => window.scrollTo(0, 420));
    await expect(hero).toHaveAttribute('data-side', 'daring');
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
