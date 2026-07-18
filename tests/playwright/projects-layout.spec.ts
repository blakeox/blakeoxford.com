import { test, expect } from './fixtures';

test.describe('Projects page layout', () => {
  test('uses portfolio showcase shells and clears the navbar', async ({ page }) => {
    await page.goto('/projects/');

    await page.waitForSelector('main#main-content');
    const heroSection = page.locator('section[data-layout-section="projects-hero"]');
    await expect(heroSection).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Systems I've shipped/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Hire me for the hard middle/i })).toBeVisible();

    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const heroSection = document.querySelector('section[data-layout-section="projects-hero"]');
      const gridSection = document.querySelector('section[data-layout-section="projects-grid"]');
      const featuredSection = document.querySelector(
        'section[data-layout-section="projects-featured"]'
      );
      const heroShell = heroSection?.querySelector('[data-layout-shell="projects-hero-inner"]');
      const gridShell = gridSection?.querySelector('[data-layout-shell="projects-grid-inner"]');
      const heroHeadingEl = heroSection?.querySelector('h1');

      const navRect = header?.getBoundingClientRect() ?? null;
      const heroRect = heroSection?.getBoundingClientRect() ?? null;
      const heroShellRect = heroShell ? (heroShell as HTMLElement).getBoundingClientRect() : null;
      const gridShellRect = gridShell ? (gridShell as HTMLElement).getBoundingClientRect() : null;
      const main = document.querySelector('main#main-content');
      const mainStyles = main ? window.getComputedStyle(main) : null;

      return {
        hasHeader: Boolean(header),
        hasHeroSection: Boolean(heroSection),
        hasFeaturedSection: Boolean(featuredSection),
        hasHeroShell: Boolean(heroShell),
        hasGridShell: Boolean(gridShell),
        navBottom: navRect?.bottom ?? null,
        heroTop: heroRect?.top ?? null,
        mainPaddingTop: mainStyles ? parseFloat(mainStyles.paddingTop || '0') : null,
        heroShell: heroShellRect
          ? {
              left: heroShellRect.left,
              right: window.innerWidth - heroShellRect.right,
            }
          : null,
        heroHeadingText: heroHeadingEl?.textContent?.trim() ?? null,
        gridShell: gridShellRect
          ? {
              left: gridShellRect.left,
              right: window.innerWidth - gridShellRect.right,
            }
          : null,
      };
    });

    expect(metrics.hasHeader).toBeTruthy();
    expect(metrics.hasHeroSection).toBeTruthy();
    expect(metrics.hasFeaturedSection).toBeTruthy();
    expect(metrics.hasHeroShell).toBeTruthy();
    expect(metrics.hasGridShell).toBeTruthy();

    expect(metrics.heroHeadingText).not.toBeNull();
    expect(metrics.heroHeadingText?.toLowerCase()).toContain("systems i've shipped");

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

    expect(metrics.gridShell).not.toBeNull();
    if (metrics.gridShell) {
      const gridGapDifference = Math.abs(metrics.gridShell.left - metrics.gridShell.right);
      expect(metrics.gridShell.left).toBeGreaterThanOrEqual(24);
      expect(gridGapDifference).toBeLessThanOrEqual(6);
    }
  });
});
