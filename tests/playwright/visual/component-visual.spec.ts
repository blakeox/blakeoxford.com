import { test, expect, type Page } from '../fixtures';
import { preparePage } from './_visualHelper';
import {
  componentVisualBaselines,
  type CommandCenterVisualSetup,
} from '../../../src/data/componentVisualBaselines';
import { captureNavBaselineScreenshot, setupNavVisual } from './_navVisualSetup';
import { waitForViewportSettle } from '../utils/deterministic-waits';

async function normalizeCommandCenterOverlay(page: Page) {
  const overlay = page.locator('#search-overlay').first();
  await overlay.evaluate((el) => {
    el.setAttribute('data-state', 'open');
    el.classList.add('active');
    el.removeAttribute('inert');
    (el as HTMLElement).style.visibility = 'visible';
    (el as HTMLElement).style.opacity = '1';
    (el as HTMLElement).style.pointerEvents = 'auto';
    (el as HTMLElement).style.display = 'block';
  });
  await page.evaluate(() => {
    const overlay = document.querySelector('#search-overlay');
    if (overlay && overlay.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
    }
  });
  return overlay;
}

async function openCommandCenter(page: Page) {
  const toggle = page.locator('#search-toggle, [data-test="open-search"], button:has-text("Search")').first();
  if (await toggle.isVisible()) {
    await toggle.click();
  } else {
    await page.keyboard.press('Meta+K');
  }

  const overlay = page.locator('#search-overlay').first();
  await overlay.waitFor({ state: 'attached', timeout: 10000 });
  await normalizeCommandCenterOverlay(page);
  await expect(overlay).toBeVisible();
}

async function setupCommandCenter(page: Page, setup: CommandCenterVisualSetup) {
  await page.evaluate(() => window.localStorage.removeItem('command-center:recent'));
  await openCommandCenter(page);
  const input = page.locator('#search-input');

  if (setup === 'results') {
    await input.fill('fabric');
    await page.locator('[data-search-result]').first().waitFor({ state: 'visible', timeout: 15000 });
    await waitForViewportSettle(page, 300);
  } else if (setup === 'empty') {
    await input.fill('zzzzno-results-visual-test-xyz');
    await page.locator('.rounded-xl.border-dashed').first().waitFor({ state: 'visible', timeout: 15000 });
    await waitForViewportSettle(page, 300);
  } else if (setup === 'ask') {
    await input.fill('?microsoft fabric');
    await page.locator('[data-command-ask-state]').waitFor({ state: 'visible', timeout: 5000 });
    await page.evaluate(() => {
      const panel = document.querySelector('[data-panel]') as HTMLElement | null;
      if (panel) panel.style.height = '240px';
    });
  } else {
    await waitForViewportSettle(page, 300);
  }

  await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active?.blur) active.blur();
    const input = document.getElementById('search-input') as HTMLInputElement | null;
    if (input) {
      input.style.caretColor = 'transparent';
    }
  });
}

// Component-level focused snapshots (smaller surface, faster diff isolation)
// Tags: @visual-essential @visual-components
// Registry: src/data/componentVisualBaselines.ts (linked from componentDocs.ts)

test.describe('@visual-essential @visual-components Component Visual Snapshots', () => {
  for (const cfg of Object.values(componentVisualBaselines)) {
    test(`component visual ${cfg.key}`, async ({ page }) => {
      await preparePage(page);
      if (cfg.viewport) {
        await page.setViewportSize(cfg.viewport);
      }
      await page.goto(cfg.route, { waitUntil: 'networkidle' });

      const element = page.locator(cfg.selector).first();

      if (cfg.commandCenterSetup) {
        await setupCommandCenter(page, cfg.commandCenterSetup);
      } else if (cfg.openMobileMenu || cfg.navSetup || cfg.selector.includes('.nav-shell')) {
        await setupNavVisual(page, cfg);
      }

      if (cfg.screenshotClip) {
        await captureNavBaselineScreenshot(page, cfg, element);
        return;
      }

      await expect(element).toBeVisible();

      if (cfg.commandCenterSetup === 'ask') {
        await element.evaluate((el) => {
          el.style.boxSizing = 'border-box';
          el.style.height = '240px';
        });
      } else {
        await element.evaluate((el) => {
          try {
            el.style.boxSizing = 'border-box';
            const rect = el.getBoundingClientRect();
            el.style.height = `${Math.ceil(rect.height)}px`;
          } catch {
            void 0;
          }
        });
      }

      await expect(element).toHaveScreenshot(cfg.snapshotFile, {
        animations: 'disabled',
        maxDiffPixelRatio: cfg.commandCenterSetup ? 0.04 : 0.02,
        scale: 'css',
        threshold: 0.01,
      });
    });
  }
});
