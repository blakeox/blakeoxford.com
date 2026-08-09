import { test, expect } from '../fixtures';

test.describe('home hero identity transition', () => {
  test('keeps only one identity line visible at the Work to Daring handoff', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('[data-home-dual]');
    const workLine = hero.locator('[data-dual-line-work]');
    const daringLine = hero.locator('[data-dual-line-daring]');

    await expect(hero).toHaveAttribute('data-side', 'work');
    await expect(workLine).toBeVisible();
    await expect(daringLine).toBeHidden();

    const scrollHero = async (rawProgress: number) => {
      await page.evaluate((progress) => {
        const track = document.querySelector<HTMLElement>('.home-dual-track');
        const sticky = document.querySelector<HTMLElement>('.home-dual-sticky');
        if (!track || !sticky) throw new Error('Home hero scroll track is missing');

        const travel = Math.max(1, track.offsetHeight - sticky.offsetHeight);
        window.scrollTo(0, track.getBoundingClientRect().top + window.scrollY + travel * progress);
      }, rawProgress);
    };

    await scrollHero(0.39);
    await expect(hero).toHaveAttribute('data-side', 'work');
    await expect(workLine).toBeVisible();
    await expect(daringLine).toBeHidden();

    await scrollHero(0.41);
    await expect(hero).toHaveAttribute('data-side', 'daring');
    await expect(workLine).toBeHidden();
    await expect(daringLine).toBeVisible();
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
