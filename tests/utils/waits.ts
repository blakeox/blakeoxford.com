import { Page, Locator, expect } from '@playwright/test';

// Deterministic wait helpers to replace arbitrary timeouts
export async function waitForIdle(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

export async function waitForVisible(locator: Locator) {
  await expect(locator).toBeVisible();
  return locator;
}

export async function waitForTransitionEnd(page: Page, selector: string, timeout = 2000) {
  await page.evaluate(({ sel, to }) => {
    return new Promise(resolve => {
      const el = document.querySelector(sel);
      if (!el) return resolve(null);
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(null); } };
      el.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, to);
    });
  }, { sel: selector, to: timeout });
}

export async function waitForSearchResults(page: Page) {
  const container = page.locator('#search-results');
  await container.first().waitFor({ state: 'attached' });
  return container;
}

// Wait for the search overlay/input logic to be ready by probing for the input after triggering
export async function waitForSearchOverlay(page: Page) {
  const overlay = page.locator('#search-overlay');
  await overlay.first().waitFor({ state: 'attached' });
  return overlay;
}

export async function waitForSearchResultItem(page: Page, timeout = 2000) {
  const item = page.locator('#search-results .search-result-item').first();
  await item.waitFor({ state: 'visible', timeout }).catch(() => {}); // tolerate empty results
  return item;
}

// Wait for data-theme attribute toggle (light/dark)
export async function waitForTheme(page: Page, theme: 'light' | 'dark', timeout = 2000) {
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    theme,
    { timeout }
  ).catch(() => {}); // Non-fatal if theme system not present
}

// Poll for layout stability by ensuring two consecutive animation frames with matching dimensions
export async function waitForLayoutStability(page: Page, cycles = 2, timeout = 3000) {
  const start = Date.now();
  let stableCount = 0;
  let lastMetrics: { w: number; h: number; scH: number; scW: number } | null = null;
  while (Date.now() - start < timeout && stableCount < cycles) {
    const metrics = await page.evaluate(() => ({
      w: document.body.clientWidth,
      h: document.body.clientHeight,
      scH: document.scrollingElement?.scrollHeight || 0,
      scW: document.scrollingElement?.scrollWidth || 0,
    }));
    if (
      lastMetrics &&
      metrics.w === lastMetrics.w &&
      metrics.h === lastMetrics.h &&
      metrics.scH === lastMetrics.scH &&
      metrics.scW === lastMetrics.scW
    ) {
      stableCount++;
    } else {
      stableCount = 0;
    }
    lastMetrics = metrics;
    await page.waitForTimeout(50);
  }
}

// Generic condition waiter
export async function waitForCondition(page: Page, predicate: () => Promise<boolean> | boolean, timeout = 2000, interval = 50) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await predicate()) return true;
    await page.waitForTimeout(interval);
  }
  return false;
}

// Mobile menu state helper using existing DOM heuristics
export async function waitForMenuState(page: Page, selector: string, open: boolean, timeout = 2000) {
  await waitForCondition(
    page,
    async () => {
      return page.evaluate(
        ({ sel, shouldBeOpen }) => {
          const el = document.querySelector<HTMLElement>(sel);
            if (!el) return false;
            const hasActiveClass = el.classList.contains('active');
            const styles = window.getComputedStyle(el);
            const isVisible = styles.visibility !== 'hidden' && styles.display !== 'none';
            const offscreen = styles.right === '-100vw' || styles.transform.includes('-100');
            const computedOpen = hasActiveClass || (isVisible && !offscreen);
            return shouldBeOpen ? computedOpen : !computedOpen;
        },
        { sel: selector, shouldBeOpen: open }
      );
    },
    timeout
  );
}

export async function waitForAriaExpanded(locator: Locator, value: 'true' | 'false') {
  await expect(locator).toHaveAttribute('aria-expanded', value);
}
