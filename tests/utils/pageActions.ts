// Shared Playwright page action helpers (Phase 0 minimal)
// Will be imported in future consolidated specs.
import { Page, expect } from '@playwright/test';

export async function openSearchOverlay(page: Page) {
  await page.keyboard.press('Control+k');
  const overlay = page.locator('#search-overlay');
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
