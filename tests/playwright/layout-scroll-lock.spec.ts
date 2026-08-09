import { test, expect } from '@playwright/test';
import { waitForViewportSettle } from './utils/deterministic-waits';

async function readLayout(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const main = document.querySelector('main');
    return {
      bodyPosition: getComputedStyle(body).position,
      bodyTop: body.style.top,
      bodyInlineWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      innerWidth: window.innerWidth,
      mainLeft: main?.getBoundingClientRect().left ?? null,
      mainWidth: main?.getBoundingClientRect().width ?? null,
    };
  });
}

test.describe('Page layout after overlays @essential', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForFunction(() => (window as Window & { __navHydrated?: boolean }).__navHydrated === true, {
      timeout: 10000,
    });
  });

  test('mobile menu does not leave body fixed or horizontally shifted', async ({ page }) => {
    const before = await readLayout(page);
    expect(before.bodyPosition).toBe('static');
    expect(before.scrollWidth).toBeLessThanOrEqual(before.clientWidth + 1);

    await page.locator('#nav-toggle').click();
    const open = await readLayout(page);
    expect(open.bodyPosition).toBe('fixed');

    await page.locator('#nav-toggle').click();
    const after = await readLayout(page);
    expect(after.bodyPosition).toBe('static');
    expect(after.bodyTop).toBe('');
    expect(after.bodyInlineWidth).toBe('');
    expect(after.scrollWidth).toBeLessThanOrEqual(after.clientWidth + 1);
    expect(after.mainLeft).toBe(0);
    expect(after.mainWidth).toBeCloseTo(390, 0);
  });

  test('command center does not leave body fixed after close', async ({ page }) => {
    await page.locator('#search-toggle').click();
    await expect(page.locator('#search-overlay')).toHaveAttribute('data-state', 'open');

    const open = await readLayout(page);
    expect(open.bodyPosition).toBe('fixed');

    await page.keyboard.press('Escape');
    await expect(page.locator('#search-overlay')).toHaveAttribute('data-state', 'closed');

    const after = await readLayout(page);
    expect(after.bodyPosition).toBe('static');
    expect(after.scrollWidth).toBeLessThanOrEqual(after.clientWidth + 1);
    expect(after.mainLeft).toBe(0);
  });

  test('opening search while menu is open keeps a single scroll lock owner', async ({ page }) => {
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'open');

    await page.locator('#search-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'closed');
    await expect(page.locator('#search-overlay')).toHaveAttribute('data-state', 'open');

    const duringSearch = await readLayout(page);
    expect(duringSearch.bodyPosition).toBe('fixed');

    await page.keyboard.press('Escape');

    const after = await readLayout(page);
    expect(after.bodyPosition).toBe('static');
    expect(after.mainLeft).toBe(0);
  });

  test('mobile menu closes on Astro client navigation', async ({ page }) => {
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'open');

    await page.evaluate(() => {
      document.dispatchEvent(new Event('astro:page-load'));
    });

    await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'closed');
    const after = await readLayout(page);
    expect(after.bodyPosition).toBe('static');
  });

  test('mobile menu closes when viewport expands to desktop', async ({ page }) => {
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'open');

    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForViewportSettle(page, 100);

    await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'closed');
    const after = await readLayout(page);
    expect(after.bodyPosition).toBe('static');
  });
});
