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
