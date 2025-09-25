import { test, expect } from '@playwright/test';

test.describe('Projects page layout', () => {
  test('uses Tailwind layout shells and clears the navbar', async ({ page }) => {
    await page.goto('/projects/');

    await page.waitForSelector('main#main-content');
    await page.waitForSelector('section:nth-of-type(1) .layout-shell-wide, section:nth-of-type(1) .layout-shell');
  await page.waitForSelector('section[data-a11y-allow-color-contrast] .layout-shell, section[data-a11y-allow-color-contrast] .layout-shell-wide');

    const heading = page.getByRole('heading', { name: 'Projects' });
    await expect(heading).toBeVisible();

    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const heroSection = Array.from(document.querySelectorAll('section')).find((section) => {
        const sectionHeading = section.querySelector('h1, h2');
        return sectionHeading?.textContent?.trim() === 'Projects';
      });
  const methodologySection = document.querySelector('section[data-a11y-allow-color-contrast]');
      const heroContainer = heroSection?.querySelector('.layout-shell-wide, .layout-shell');
  const methodologyContainer = methodologySection?.querySelector('.layout-shell, .layout-shell-wide');

      const navRect = header?.getBoundingClientRect() ?? null;
      const heroRect = heroSection?.getBoundingClientRect() ?? null;
      const heroShellRect = heroContainer ? (heroContainer as HTMLElement).getBoundingClientRect() : null;
      const methodologyShellRect = methodologyContainer ? (methodologyContainer as HTMLElement).getBoundingClientRect() : null;
      const main = document.querySelector('main#main-content');
      const mainStyles = main ? window.getComputedStyle(main) : null;

      return {
        hasHeader: Boolean(header),
        hasHeroSection: Boolean(heroSection),
        hasHeroShell: Boolean(heroContainer),
        hasMethodologyShell: Boolean(methodologyContainer),
        navBottom: navRect?.bottom ?? null,
        heroTop: heroRect?.top ?? null,
        mainPaddingTop: mainStyles ? parseFloat(mainStyles.paddingTop || '0') : null,
        heroShell: heroShellRect
          ? {
              left: heroShellRect.left,
              right: window.innerWidth - heroShellRect.right,
            }
          : null,
        methodologyShell: methodologyShellRect
          ? {
              left: methodologyShellRect.left,
              right: window.innerWidth - methodologyShellRect.right,
            }
          : null,
      };
    });

    expect(metrics.hasHeader).toBeTruthy();
    expect(metrics.hasHeroSection).toBeTruthy();
    expect(metrics.hasHeroShell).toBeTruthy();
    expect(metrics.hasMethodologyShell).toBeTruthy();

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

    expect(metrics.methodologyShell).not.toBeNull();
    if (metrics.methodologyShell) {
      const methodologyGapDifference = Math.abs(metrics.methodologyShell.left - metrics.methodologyShell.right);
      expect(metrics.methodologyShell.left).toBeGreaterThanOrEqual(24);
      expect(methodologyGapDifference).toBeLessThanOrEqual(6);
    }
  });
});
