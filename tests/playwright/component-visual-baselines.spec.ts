import { test, expect, type Page } from './fixtures';
import { preparePage } from './visual/_visualHelper';
import {
  componentVisualBaselines,
  type ComponentVisualBaselineKey,
} from '../../src/data/componentVisualBaselines';

// Visual baselines for critical components
// Tags: @visual @visual-components

const NAV_BASELINE_KEYS = [
  'navbar',
  'navbarMobileClosed',
  'navbarMobileOpen',
  'navbarScrolled',
] as const satisfies readonly ComponentVisualBaselineKey[];

async function capturePreview(page: Page, route: string, name: string) {
  await page.goto(route);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForLoadState('load');
  await page.evaluate(async () => {
    try {
      if (document.fonts && 'ready' in document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      /* noop */
    }
  });
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: false,
    animations: 'disabled',
    maxDiffPixelRatio: 0.005,
  });
}

async function setupNavVisual(page: Page, cfg: (typeof componentVisualBaselines)[ComponentVisualBaselineKey]) {
  await page.waitForFunction(() => (window as Window & { __navHydrated?: boolean }).__navHydrated === true, {
    timeout: 10000,
  });

  if (cfg.navSetup === 'scrolled') {
    await page.evaluate(() => window.scrollTo(0, 120));
    await page.waitForFunction(() => document.querySelector('.nav-shell--scrolled') !== null, { timeout: 5000 });
  }

  if (cfg.openMobileMenu) {
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveClass(/active/);
    await expect(page.locator('#nav-mobile-backdrop')).toHaveAttribute('data-state', 'open');
  }
}

test.describe('Component Visual Baselines @visual @visual-components', () => {
  test('nav preview', async ({ page }) => {
    await capturePreview(page, '/components/nav-preview', 'nav');
  });

  test('project card preview', async ({ page }) => {
    await capturePreview(page, '/components/project-card-preview', 'project-card');
  });

  for (const key of NAV_BASELINE_KEYS) {
    const cfg = componentVisualBaselines[key];

    test(`production ${cfg.key}`, async ({ page }) => {
      await preparePage(page);
      if (cfg.viewport) {
        await page.setViewportSize(cfg.viewport);
      }
      await page.goto(cfg.route, { waitUntil: 'networkidle' });
      await setupNavVisual(page, cfg);

      const element = page.locator(cfg.selector).first();
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
    });
  }
});
