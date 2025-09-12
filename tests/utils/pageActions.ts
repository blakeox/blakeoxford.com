// Shared Playwright page action helpers (Phase 0 minimal)
// Will be imported in future consolidated specs.
import { Page, expect } from '@playwright/test';
import { waitForSearchResults } from '../playwright/utils/test-helpers';

export async function openSearchOverlay(page: Page) {
  const overlay = page.locator('#search-overlay');
  // Clear any initial focus oddities
  await page.evaluate(() => document.activeElement instanceof HTMLElement && (document.activeElement as HTMLElement).blur());

  const combo = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';
  await page.keyboard.press(combo);

  // If overlay not visible quickly, try alternative triggers
  await waitForSearchResults(page);
  if (!(await overlay.isVisible())) {
    // Attempt to click a known trigger if present
    const trigger = page.locator('[data-search-trigger], button[aria-label*="Search" i], button[id*="search" i]');
    if (await trigger.first().isVisible()) {
      await trigger.first().click();
    } else {
      // Dispatch custom event if site listens for it
      await page.evaluate(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        window.dispatchEvent(new CustomEvent('open-search'));
      });
    }
  }

  // Wait for overlay to lose inert and become visible
  await page.waitForFunction(() => {
    const el = document.querySelector('#search-overlay');
    if (!el) return false;
    const inert = (el as HTMLElement).hasAttribute('inert');
    const style = window.getComputedStyle(el as HTMLElement);
    return !inert && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0 && (el as HTMLElement).getBoundingClientRect().height > 0;
  }, { timeout: 3000 });

  await expect(overlay).toBeVisible();
  return overlay;
}

export async function fillSearch(page: Page, query: string) {
  const input = page.locator('#search-input');
  await input.fill(query);
  return input;
}

export async function navigateMain(page: Page, path: string) {
  await page.click(`a[href="${path}"]`);
  await expect(page).toHaveURL(new RegExp(path.replace(/\/$/, '')));
}
