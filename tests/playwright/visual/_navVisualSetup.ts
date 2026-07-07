import { expect, type Page } from '@playwright/test';

import type { ComponentVisualBaseline } from '../../../src/data/componentVisualBaselines';

export async function waitForNavHydration(page: Page) {
  await page.waitForFunction(() => (window as Window & { __navHydrated?: boolean }).__navHydrated === true, {
    timeout: 10000,
  });
}

export async function setupNavVisual(page: Page, cfg: ComponentVisualBaseline) {
  await waitForNavHydration(page);

  if (cfg.navSetup === 'scrolled') {
    await page.evaluate(() => window.scrollTo(0, 120));
    await page.waitForFunction(() => document.querySelector('.nav-shell--scrolled') !== null, { timeout: 5000 });
  }

  if (cfg.navSetup === 'autoHidden') {
    await page.mouse.move(640, 400);
    for (let i = 0; i < 8; i += 1) {
      await page.mouse.wheel(0, 150);
      await page.waitForTimeout(40);
    }
    await page.waitForFunction(() => document.querySelector('.nav-shell--auto-hidden') !== null, { timeout: 5000 });
  }

  if (cfg.openMobileMenu) {
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveClass(/active/);
    await expect(page.locator('#nav-mobile-backdrop')).toHaveAttribute('data-state', 'open');
  }
}

export async function captureNavBaselineScreenshot(
  page: Page,
  cfg: ComponentVisualBaseline,
  element: ReturnType<Page['locator']>,
) {
  if (cfg.screenshotClip) {
    await expect(page).toHaveScreenshot(cfg.snapshotFile, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
      scale: 'css',
      threshold: 0.01,
      clip: cfg.screenshotClip,
    });
    return;
  }

  await expect(element).toBeVisible();

  await element.evaluate((el) => {
    try {
      el.style.boxSizing = 'border-box';
      const rect = el.getBoundingClientRect();
      el.style.height = `${Math.round(rect.height)}px`;
    } catch {
      /* noop */
    }
  });

  await expect(element).toHaveScreenshot(cfg.snapshotFile, {
    animations: 'disabled',
    maxDiffPixelRatio: 0.02,
    scale: 'css',
    threshold: 0.01,
  });
}
