import { test, expect } from '../fixtures';
import { disableAnimationsComprehensive, waitForStability } from '../utils/test-helpers';
import { waitForTheme } from '../../utils/waits';
import { seedThemePreference } from '../../utils/themeActions';

test.describe('@visual Dark mode route baselines', () => {
  test.beforeEach(async ({ page }) => {
    await seedThemePreference(page, 'dark');
    await disableAnimationsComprehensive(page);
  });

  const darkRoutes = [
    { name: 'homepage', path: '/' },
    { name: 'about', path: '/about/' },
    { name: 'projects', path: '/projects/' },
    { name: 'blog-post', path: '/blog/building-my-own-local-llm-stack/' },
  ] as const;

  for (const route of darkRoutes) {
    test(`${route.name} matches dark mode baseline`, async ({ page }) => {
      await page.goto(route.path);
      await waitForStability(page);
      await waitForTheme(page, 'dark', 5000);

      await expect(page.locator('html')).toHaveClass(/dark/);

      await expect(page.locator('main').first()).toHaveScreenshot(`dark-${route.name}.png`, {
        threshold: 0.3,
        maxDiffPixels: 400000,
        mask: [
          page.locator('.coin-flip'),
          page.locator('.photo-carousel'),
          page.locator('time'),
        ],
      });
    });
  }

  test('navbar matches dark mode baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await waitForStability(page);
    await waitForTheme(page, 'dark', 5000);

    const nav = page.locator('nav').first();
    await expect(nav).toHaveScreenshot('dark-navigation-desktop.png', {
      threshold: 0.05,
      animations: 'disabled',
    });
  });
});
