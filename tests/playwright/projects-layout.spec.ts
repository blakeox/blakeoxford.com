import { test, expect } from '@playwright/test';

test.describe('Projects page layout', () => {
  test('uses Tailwind layout shells and clears the navbar', async ({ page }) => {
    await page.goto('/projects/');

    await page.waitForSelector('main#main-content');
    await page.waitForSelector('section:nth-of-type(1) [class*="max-w-6xl"], section:nth-of-type(1) [class*="max-w-4xl"]');
  const heroHeading = page.locator('h1').first();
  await expect(heroHeading).toBeVisible();

    const metrics = await page.evaluate(() => {
  const header = document.querySelector('header');
  const heroHeadingEl = document.querySelector('h1');
      const heroSection = heroHeadingEl ? heroHeadingEl.closest('section') : null;
  const journeyHeading = document.querySelector('#journey-heading');
  const journeySection = journeyHeading ? journeyHeading.closest('section') : null;
      const heroContainer = heroSection?.querySelector('[class*="max-w-6xl"], [class*="max-w-4xl"]');
      const journeyContainer = journeySection?.querySelector('[class*="max-w-6xl"], [class*="max-w-4xl"]');

      const navRect = header?.getBoundingClientRect() ?? null;
      const heroRect = heroSection?.getBoundingClientRect() ?? null;
      const heroShellRect = heroContainer ? (heroContainer as HTMLElement).getBoundingClientRect() : null;
      const journeyShellRect = journeyContainer ? (journeyContainer as HTMLElement).getBoundingClientRect() : null;
      const main = document.querySelector('main#main-content');
      const mainStyles = main ? window.getComputedStyle(main) : null;

      return {
        hasHeader: Boolean(header),
        hasHeroSection: Boolean(heroSection),
        hasHeroShell: Boolean(heroContainer),
        hasJourneyShell: Boolean(journeyContainer),
        navBottom: navRect?.bottom ?? null,
        heroTop: heroRect?.top ?? null,
        mainPaddingTop: mainStyles ? parseFloat(mainStyles.paddingTop || '0') : null,
        heroShell: heroShellRect
          ? {
              left: heroShellRect.left,
              right: window.innerWidth - heroShellRect.right,
            }
          : null,
        journeyShell: journeyShellRect
          ? {
              left: journeyShellRect.left,
              right: window.innerWidth - journeyShellRect.right,
            }
          : null,
        heroHeadingText: heroHeadingEl?.textContent?.trim() ?? null,
      };
    });

  expect(metrics.hasHeader).toBeTruthy();
    expect(metrics.hasHeroSection).toBeTruthy();
    expect(metrics.hasHeroShell).toBeTruthy();
    expect(metrics.hasJourneyShell).toBeTruthy();

  expect(metrics.heroHeadingText).not.toBeNull();
  expect(metrics.heroHeadingText?.toLowerCase()).toContain('operational intelligence');

    expect(metrics.mainPaddingTop).not.toBeNull();
    expect(metrics.mainPaddingTop!).toBeGreaterThanOrEqual(48);
    expect(metrics.navBottom).not.toBeNull();
    expect(metrics.heroTop).not.toBeNull();
    expect(metrics.heroTop!).toBeGreaterThanOrEqual((metrics.navBottom ?? 0) + 8);

    expect(metrics.heroShell).not.toBeNull();
    if (metrics.heroShell) {
      const heroGapDifference = Math.abs(metrics.heroShell.left - metrics.heroShell.right);
      expect(metrics.heroShell.left).toBeGreaterThanOrEqual(24);
      expect(heroGapDifference).toBeLessThanOrEqual(6);
    }

    expect(metrics.journeyShell).not.toBeNull();
    if (metrics.journeyShell) {
      const journeyGapDifference = Math.abs(metrics.journeyShell.left - metrics.journeyShell.right);
      expect(metrics.journeyShell.left).toBeGreaterThanOrEqual(24);
      expect(journeyGapDifference).toBeLessThanOrEqual(6);
    }
  });
});
