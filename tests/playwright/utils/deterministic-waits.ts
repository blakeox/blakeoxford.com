import { Page } from '@playwright/test';

/**
 * Waits until layout stabilizes by sampling layout viewport size & scroll height.
 * Returns early if stable for consecutive intervals.
 */
export async function waitForLayoutStability(page: Page, {interval=50, samples=5}: {interval?: number; samples?: number} = {}) {
  let last = '';
  let stableCount = 0;
  for (let i=0;i<samples*5;i++) { // hard cap loops
    const metrics = await page.evaluate(() => {
      return {
        w: window.innerWidth,
        h: window.innerHeight,
        sh: document.documentElement.scrollHeight,
        cw: document.documentElement.clientWidth,
        ch: document.documentElement.clientHeight
      };
    });
    const sig = `${metrics.w}x${metrics.h}-${metrics.sh}-${metrics.cw}x${metrics.ch}`;
    if (sig === last) stableCount++; else stableCount = 0;
    if (stableCount >= samples) return;
    last = sig;
    await page.waitForTimeout(interval);
  }
}

/** Wheel scroll in discrete steps with a short settle pause between each. */
export async function wheelScrollSteps(
  page: Page,
  { steps = 1, delta = 120, pauseMs = 40 }: { steps?: number; delta?: number; pauseMs?: number } = {},
) {
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(pauseMs);
  }
}

/** Brief pause after viewport or layout changes before asserting state. */
export async function waitForViewportSettle(page: Page, pauseMs = 100) {
  await page.waitForTimeout(pauseMs);
}
