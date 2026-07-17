import { expect, type Page } from '@playwright/test';
import { wheelScrollSteps, waitForLayoutStability } from '../utils/deterministic-waits';

import type { ComponentVisualBaseline } from '../../../src/data/componentVisualBaselines';
import { NAV_COMPONENT_DIFF } from './config';

export async function waitForNavHydration(page: Page) {
  await page.waitForFunction(() => (window as Window & { __navHydrated?: boolean }).__navHydrated === true, {
    timeout: 10000,
  });
}

async function ensureScrollablePage(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.setProperty('min-height', '250vh');
    document.body.style.setProperty('min-height', '250vh');
  });
}

async function waitForFontsReady(page: Page) {
  await page.evaluate(async () => {
    try {
      if (document.fonts && 'ready' in document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      /* noop */
    }
  });
}

export async function setupNavVisual(page: Page, cfg: ComponentVisualBaseline) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await waitForNavHydration(page);

  if (cfg.navSetup === 'scrolled' || cfg.navSetup === 'autoHidden') {
    await ensureScrollablePage(page);
  }

  if (cfg.navSetup === 'scrolled') {
    const width = cfg.viewport?.width ?? 1280;
    await page.mouse.move(width / 2, 400);
    await wheelScrollSteps(page, { steps: 4, delta: 60, pauseMs: 50 });
    await page.waitForFunction(() => document.querySelector('.nav-shell--scrolled') !== null, { timeout: 10000 });
    await waitForLayoutStability(page, { interval: 50, samples: 3 });
  }

  if (cfg.navSetup === 'autoHidden') {
    const width = cfg.viewport?.width ?? 1280;
    const height = cfg.viewport?.height ?? 800;
    await page.mouse.move(width / 2, height / 2);
    await wheelScrollSteps(page, { steps: 8, delta: 150, pauseMs: 40 });
    await page.waitForFunction(() => document.querySelector('.nav-shell--auto-hidden') !== null, { timeout: 5000 });
    await page.waitForFunction(() => {
      const shell = document.querySelector('.nav-shell--auto-hidden');
      if (!shell) return false;
      const transform = getComputedStyle(shell).transform;
      return transform !== 'none' && !transform.includes('matrix(1, 0, 0, 1, 0, 0)');
    }, { timeout: 5000 });
  }

  if (cfg.openMobileMenu) {
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'open');
    await expect(page.locator('#nav-mobile-backdrop')).toHaveAttribute('data-state', 'open');
  }
}

export async function captureNavBaselineScreenshot(
  page: Page,
  cfg: ComponentVisualBaseline,
  element: ReturnType<Page['locator']>,
) {
  await waitForFontsReady(page);

  const screenshotOptions = {
    animations: 'disabled' as const,
    maxDiffPixelRatio: NAV_COMPONENT_DIFF.maxDiffPixelRatio,
    scale: 'css' as const,
    threshold: NAV_COMPONENT_DIFF.threshold ?? 0.02,
  };

  if (cfg.screenshotClip) {
    await expect(page).toHaveScreenshot(cfg.snapshotFile, {
      ...screenshotOptions,
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

  await expect(element).toHaveScreenshot(cfg.snapshotFile, screenshotOptions);
}
