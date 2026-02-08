import { test, expect } from '@playwright/test';

test.describe('About page layout', () => {
  test('uses layout shells, preserves navbar offset, and exposes accessible connect links', async ({ page }) => {
    await page.goto('/about/');

    await page.waitForSelector('main#main-content');
    await page.waitForSelector('#about-me [class*="max-w-"]');
    await page.waitForSelector('#about-social [class*="max-w-"]');

    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const main = document.querySelector('main#main-content');
      const heroSection = document.getElementById('about-me');
      const heroShell = heroSection?.querySelector('[class*="max-w-"]') ?? null;
      const connectSection = document.getElementById('about-social');
      const connectShell = connectSection?.querySelector('[class*="max-w-"]') ?? null;

      const mainStyles = main ? window.getComputedStyle(main) : null;
      const mainRect = main ? main.getBoundingClientRect() : null;
      const heroShellRect = heroShell ? heroShell.getBoundingClientRect() : null;
      const connectShellRect = connectShell ? connectShell.getBoundingClientRect() : null;
      const navRect = header?.getBoundingClientRect() ?? null;
      const heroSectionRect = heroSection?.getBoundingClientRect() ?? null;

      const linkData = Array.from(connectSection?.querySelectorAll('a[aria-label]') ?? []).map((link) => ({
        ariaLabel: link.getAttribute('aria-label') ?? '',
        rel: (link.getAttribute('rel') ?? '').toLowerCase(),
        target: link.getAttribute('target') ?? '',
      }));

      const heroHeading = document.getElementById('about-me-title');
      const heroHeadingColor = heroHeading ? window.getComputedStyle(heroHeading).color : null;

      return {
        hasHeader: Boolean(header),
        mainPaddingTop: mainStyles ? parseFloat(mainStyles.paddingTop || '0') : null,
        // Measure left/right offsets relative to the main content container
        heroShell: heroShellRect && mainRect
          ? {
              left: heroShellRect.left - mainRect.left,
              right: mainRect.right - heroShellRect.right,
            }
          : heroShellRect
          ? { left: heroShellRect.left, right: window.innerWidth - heroShellRect.right }
          : null,
        connectShell: connectShellRect && mainRect
          ? {
              left: connectShellRect.left - mainRect.left,
              right: mainRect.right - connectShellRect.right,
            }
          : connectShellRect
          ? { left: connectShellRect.left, right: window.innerWidth - connectShellRect.right }
          : null,
        navBottom: navRect?.bottom ?? null,
        heroTop: heroSectionRect?.top ?? null,
        linkData,
        heroHeadingColor,
      };
    });

    // (debug logging removed) metrics are now used by assertions only

    expect(metrics.hasHeader).toBeTruthy();

    expect(metrics.mainPaddingTop).not.toBeNull();
    expect(metrics.mainPaddingTop!).toBeGreaterThanOrEqual(72);

    expect(metrics.navBottom).not.toBeNull();
    expect(metrics.heroTop).not.toBeNull();
    expect(metrics.heroTop!).toBeGreaterThanOrEqual((metrics.navBottom ?? 0) + 8);

    expect(metrics.heroShell).not.toBeNull();
    if (metrics.heroShell) {
      expect(metrics.heroShell.left).toBeGreaterThanOrEqual(24);
    }

    expect(metrics.connectShell).not.toBeNull();
    if (metrics.connectShell) {
      const connectGapDifference = Math.abs(metrics.connectShell.left - metrics.connectShell.right);
      expect(metrics.connectShell.left).toBeGreaterThanOrEqual(24);
      expect(connectGapDifference).toBeLessThanOrEqual(8);
    }

    expect(metrics.linkData.length).toBeGreaterThanOrEqual(3);
    for (const link of metrics.linkData) {
      expect(link.ariaLabel.toLowerCase()).toContain('open');
      expect(link.ariaLabel.toLowerCase()).toContain('profile');
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
    }

    expect(metrics.heroHeadingColor).not.toBeNull();
    expect(metrics.heroHeadingColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});
