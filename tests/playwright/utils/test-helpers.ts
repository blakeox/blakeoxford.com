import { Page, Locator } from '@playwright/test';
import { waitForLayoutStability } from './deterministic-waits';
import { ensureImagesReady } from './image-helpers';
// Fixed: removed invalid re-export referencing a non-existent file

export async function waitForAsyncOperation(page: Page, timeout = 1000) {
  await page.waitForTimeout(timeout);
}

export async function waitForKeyboardResponse(page: Page) {
  await page.waitForTimeout(50);
}

// Accept optional timeout (ms) for additional settling time
export async function waitForStability(
  page: Page,
  extraTimeout?: number
) {
  await waitForLayoutStability(page, { interval: 50, samples: 4 });
  if (typeof extraTimeout === 'number' && extraTimeout > 0) {
    await page.waitForTimeout(extraTimeout);
  }
}

export async function getFirstVisible(page: Page, selector: string): Promise<Locator> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  return el;
}

export { ensureImagesReady };

// Provide an alias expected by some tests
export async function waitForImagesWithFallback(page: Page, timeout = 15000) {
  await ensureImagesReady(page, timeout);
}

// Robustly disable animations/transitions for deterministic screenshots
export async function disableAnimationsComprehensive(page: Page) {
  // Respect reduced motion for the page
  await page.emulateMedia({ reducedMotion: 'reduce' });

  // Inject CSS to disable transitions/animations
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        -webkit-transition: none !important;
        transition: none !important;
        -webkit-animation: none !important;
        animation: none !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
      }
      html, body { scroll-behavior: auto !important; }
      [data-animate], [class*="animate-"], [class*="transition"], [class*="duration-"], [class*="ease-"] {
        -webkit-transition: none !important;
        transition: none !important;
        -webkit-animation: none !important;
        animation: none !important;
      }
    `
  });

  // Small wait to ensure style application
  await page.waitForTimeout(10);
}

// Navigate with retries to avoid transient start-up/network hiccups in CI
export async function navigateWithRetry(
  page: Page,
  url: string,
  { timeout = 30000, maxRetries = 2 }: { timeout?: number; maxRetries?: number } = {}
) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
      // Wait for network to settle a bit for stability
      await page.waitForLoadState('networkidle', { timeout: Math.min(10000, timeout) });
      return;
    } catch (err) {
      lastErr = err;
      // brief backoff before retrying
      await page.waitForTimeout(250 + attempt * 250);
    }
  }
  throw lastErr;
}
