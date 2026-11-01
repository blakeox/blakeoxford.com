import { test, expect } from '../fixtures';

test.describe('home hero identity', () => {
  test('shows one sentence and two actions in the first viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('#about-me');
    // Identity and actions must be readable immediately, including with motion allowed.
    const fadingContent = await page
      .locator('.home-dual-copy')
      .evaluate((node) =>
        node
          .getAnimations({ subtree: true })
          .some((animation) =>
            (animation.effect as KeyframeEffect)
              .getKeyframes()
              .some((frame) => frame.opacity !== undefined && Number(frame.opacity) < 1)
          )
      );
    expect(fadingContent).toBe(false);
    await expect(hero.getByRole('heading', { name: 'Blake Oxford' })).toBeVisible();
    await expect(
      hero.getByText('Helping companies navigate AI—and scale it across the enterprise.')
    ).toBeVisible();
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
