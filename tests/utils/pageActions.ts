// Shared Playwright page action helpers (Phase 0 minimal)
// Will be imported in future consolidated specs.
import { Page, expect } from '@playwright/test';
import { waitForSearchResults } from '../playwright/utils/test-helpers';

export async function openSearchOverlay(page: Page) {
  const overlay = page.locator('#search-overlay');
  // Clear any initial focus oddities
  await page.evaluate(() => document.activeElement instanceof HTMLElement && (document.activeElement as HTMLElement).blur());

  // Prefer clicking the explicit toggle if present
  const toggle = page.locator('#search-toggle');
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  } else {
    // Fallback shortcuts: '/' is wired in component script; Meta+K for convenience
    await page.keyboard.press('/').catch(() => {});
    const combo = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';
    await page.keyboard.press(combo).catch(() => {});
  }

  // Wait for overlay activation (class + style + inert removed)
  const activated = await page.waitForFunction(() => {
    const el = document.querySelector('#search-overlay') as HTMLElement | null;
    if (!el) return false;
    const inert = el.hasAttribute('inert');
    const style = el ? window.getComputedStyle(el) : null;
    const visible = !!style && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0;
    return !inert && el.classList.contains('active') && visible;
  }, { timeout: 3000 }).catch(() => false as const);

  // If still not active, attempt to force init + open via page script
  if (!activated) {
    await page.evaluate(async () => {
      try {
        const ensure = async () => {
          const g: any = window as any;
          if (!g.enhancedSearchOverlay && g.EnhancedSearchOverlay && typeof g.initEnhancedSearchOverlay === 'function') {
            g.enhancedSearchOverlay = g.initEnhancedSearchOverlay();
          }
          return g.enhancedSearchOverlay || g.searchOverlay || null;
        };
        const inst = await ensure();
        if (inst && typeof inst.open === 'function') inst.open();
      } catch { /* noop */ }
    });

    await page.waitForFunction(() => {
      const el = document.querySelector('#search-overlay') as HTMLElement | null;
      if (!el) return false;
      const inert = el.hasAttribute('inert');
      const style = el ? window.getComputedStyle(el) : null;
      const visible = !!style && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0;
      return !inert && el.classList.contains('active') && visible;
    }, { timeout: 3000 }).catch(() => {});
  }

  await expect(overlay).toBeVisible();
  return overlay;
}

export async function fillSearch(page: Page, query: string) {
  const input = page.locator('#search-input');
  await input.fill(query);
  // Wait for results to appear after typing
  await waitForSearchResults(page, 5000);
  return input;
}

export async function navigateMain(page: Page, path: string) {
  await page.click(`a[href="${path}"]`);
  await expect(page).toHaveURL(new RegExp(path.replace(/\/$/, '')));
}
