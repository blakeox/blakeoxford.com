import { test, expect, type Page } from './fixtures';
import { preparePage } from './visual/_visualHelper';
import {
  componentVisualBaselines,
  type ComponentVisualBaselineKey,
} from '../../src/data/componentVisualBaselines';
import { captureNavBaselineScreenshot, setupNavVisual } from './visual/_navVisualSetup';

// Visual baselines for critical components
// Tags: @visual @visual-components

const NAV_BASELINE_KEYS = [
  'navbar',
  'navbarMobileClosed',
  'navbarMobileOpen',
  'navbarScrolled',
  'navbarAutoHidden',
  'navbarMobileAutoHidden',
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

test.describe('Component Visual Baselines @visual-essential @visual @visual-components', () => {
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
      await captureNavBaselineScreenshot(page, cfg, element);
    });
  }
});
