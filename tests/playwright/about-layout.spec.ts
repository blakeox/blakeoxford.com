import { test, expect } from './fixtures';

test.describe('About page layout', () => {
  test('uses layout shells, preserves navbar offset, and exposes profile links', async ({
    page,
  }) => {
    await page.goto('/about/');

    await page.waitForSelector('main#main-content');
    await page.waitForSelector('#about-me');
    await page.waitForSelector('#about-closing-title');

    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const main = document.querySelector('main#main-content');
      const heroSection = document.getElementById('about-me');
      const heroShell = heroSection?.querySelector('[class*="max-w-"]') ?? null;
      const closing = document.getElementById('about-closing-title')?.closest('section');
      const closingShell = closing?.querySelector('[class*="max-w-"]') ?? null;

      const mainStyles = main ? window.getComputedStyle(main) : null;
      const mainRect = main ? main.getBoundingClientRect() : null;
      const heroShellRect = heroShell ? heroShell.getBoundingClientRect() : null;
      const closingShellRect = closingShell ? closingShell.getBoundingClientRect() : null;
      const navRect = header?.getBoundingClientRect() ?? null;
      const heroSectionRect = heroSection?.getBoundingClientRect() ?? null;

      const linkData = Array.from(
        closing?.querySelectorAll('a[href*="linkedin"], a[href*="github"], a[href*="microsoft"]') ??
          []
      ).map((link) => ({
        href: link.getAttribute('href') ?? '',
        rel: (link.getAttribute('rel') ?? '').toLowerCase(),
        target: link.getAttribute('target') ?? '',
        text: (link.textContent ?? '').trim(),
      }));

      const heroHeading = document.getElementById('about-me-title');
      const heroHeadingColor = heroHeading ? window.getComputedStyle(heroHeading).color : null;

      return {
        hasHeader: Boolean(header),
        mainPaddingTop: mainStyles ? parseFloat(mainStyles.paddingTop || '0') : null,
        heroShell:
          heroShellRect && mainRect
            ? {
                left: heroShellRect.left - mainRect.left,
                right: mainRect.right - heroShellRect.right,
              }
            : heroShellRect
              ? { left: heroShellRect.left, right: window.innerWidth - heroShellRect.right }
              : null,
        closingShell:
          closingShellRect && mainRect
            ? {
                left: closingShellRect.left - mainRect.left,
                right: mainRect.right - closingShellRect.right,
              }
            : closingShellRect
              ? { left: closingShellRect.left, right: window.innerWidth - closingShellRect.right }
              : null,
        navBottom: navRect?.bottom ?? null,
        heroTop: heroSectionRect?.top ?? null,
        linkData,
        heroHeadingColor,
      };
    });

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

    expect(metrics.closingShell).not.toBeNull();
    if (metrics.closingShell) {
      const gap = Math.abs(metrics.closingShell.left - metrics.closingShell.right);
      expect(metrics.closingShell.left).toBeGreaterThanOrEqual(24);
      expect(gap).toBeLessThanOrEqual(8);
    }

    expect(metrics.linkData.length).toBeGreaterThanOrEqual(3);
    for (const link of metrics.linkData) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
      expect(link.text.length).toBeGreaterThan(0);
    }

    expect(metrics.heroHeadingColor).not.toBeNull();
    expect(metrics.heroHeadingColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});
