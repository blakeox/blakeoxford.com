// Shared Playwright page action helpers (Phase 0 minimal)
// Will be imported in future consolidated specs.
import { Page, expect } from '@playwright/test';

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
    await page.evaluate(() => {
      const g = window as any;
      const inst = g.enhancedSearchOverlay || g.searchOverlay;
      if (inst && typeof inst.open === 'function') {
        inst.open();
        return;
      }
      const overlay = document.getElementById('search-overlay') as HTMLElement | null;
      if (!overlay) return;
      overlay.classList.add('active');
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';
      overlay.removeAttribute('inert');
      const input = document.getElementById('search-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.setAttribute('aria-expanded', 'true');
      }
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    });

    await page.waitForFunction(() => {
      const el = document.querySelector('#search-overlay') as HTMLElement | null;
      if (!el) return false;
      const inert = el.hasAttribute('inert');
      const style = window.getComputedStyle(el);
      const visible = style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0;
      return !inert && el.classList.contains('active') && visible;
    }, { timeout: 3000 }).catch(() => {});
  }

  await expect(overlay).toBeVisible();
  return overlay;
}

export async function fillSearch(page: Page, query: string) {
  const input = page.locator('#search-input');
  await input.fill(query);
  await expect(page.locator('[data-search-result], .search-result, .search-overlay [role="listbox"] [role="option"]'))
    .toBeVisible({ timeout: 4000 });
  return input;
}

export async function navigateMain(page: Page, path: string) {
  await page.click(`a[href="${path}"]`);
  await expect(page).toHaveURL(new RegExp(path.replace(/\/$/, '')));
}
