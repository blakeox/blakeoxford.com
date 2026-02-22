/* global document, window */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto('http://localhost:4330/about/');
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
      windowInnerWidth: window.innerWidth,
      hasHeader: Boolean(header),
      mainPaddingTop: mainStyles ? parseFloat(mainStyles.paddingTop || '0') : null,
      heroShell: heroShellRect
        ? {
            left: heroShellRect.left,
            right: window.innerWidth - heroShellRect.right,
            width: heroShellRect.width,
            rect: {
              x: heroShellRect.x,
              y: heroShellRect.y,
              width: heroShellRect.width,
              height: heroShellRect.height,
              top: heroShellRect.top,
              right: heroShellRect.right,
              bottom: heroShellRect.bottom,
              left: heroShellRect.left
            }
          }
        : null,
      connectShell: connectShellRect
        ? {
            left: connectShellRect.left,
            right: window.innerWidth - connectShellRect.right,
            width: connectShellRect.width,
            rect: {
              x: connectShellRect.x,
              y: connectShellRect.y,
              width: connectShellRect.width,
              height: connectShellRect.height,
              top: connectShellRect.top,
              right: connectShellRect.right,
              bottom: connectShellRect.bottom,
              left: connectShellRect.left
            }
          }
        : null,
      navBottom: navRect?.bottom ?? null,
      heroTop: heroSectionRect?.top ?? null,
      linkData,
      heroHeadingColor,
    };
  });

  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();
