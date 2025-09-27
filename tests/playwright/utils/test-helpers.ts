import { Page, Locator } from '@playwright/test';
import { waitForLayoutStability } from './deterministic-waits';
import { ensureImagesReady } from './image-helpers';
export { disableAnimationsComprehensive, navigateWithRetry, waitForImagesWithFallback } from './test-helpers 2';

export async function waitForAsyncOperation(page: Page, timeout = 1000) {
  await page.waitForTimeout(timeout);
}

export async function waitForKeyboardResponse(page: Page) {
  await page.waitForTimeout(50);
}

export async function waitForStability(page: Page) {
  await waitForLayoutStability(page, { interval: 50, samples: 4 });
}

export async function getFirstVisible(page: Page, selector: string): Promise<Locator> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  return el;
}

export { ensureImagesReady };
