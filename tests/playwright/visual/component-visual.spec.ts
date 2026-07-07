import { test, expect, type Page } from '../fixtures';
import { preparePage } from './_visualHelper';
import {
  componentVisualBaselines,
  type CommandCenterVisualSetup,
} from '../../../src/data/componentVisualBaselines';

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
  await openCommandCenter(page);
  const input = page.locator('#search-input');

  if (setup === 'results') {
    await input.fill('fabric');
    await page.locator('[data-search-result]').first().waitFor({ state: 'visible', timeout: 15000 });
  } else if (setup === 'empty') {
    await input.fill('zzzzno-results-visual-test-xyz');
    await page.getByText('No results for').waitFor({ state: 'visible', timeout: 15000 });
  } else if (setup === 'ask') {
    await page.locator('#command-mode-ask').click();
    await page.locator('#command-mode-panel-ask').waitFor({ state: 'visible', timeout: 5000 });
  }

  await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active?.blur) active.blur();
  });
}

async function setupNavVisual(page: Page, cfg: (typeof componentVisualBaselines)[keyof typeof componentVisualBaselines]) {
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

      if (cfg.commandCenterSetup) {
        await setupCommandCenter(page, cfg.commandCenterSetup);
      } else if (cfg.openMobileMenu || cfg.navSetup || cfg.selector.includes('.nav-shell')) {
        await setupNavVisual(page, cfg);
        await expect(page.locator(cfg.selector).first()).toBeVisible();
      } else {
        await expect(page.locator(cfg.selector).first()).toBeVisible();
      }

      const element = page.locator(cfg.selector).first();
      await expect(element).toBeVisible();

      // Normalize element height to integer pixels to avoid subpixel rounding differences across browsers
      await element.evaluate((el) => {
        try {
          el.style.boxSizing = 'border-box';
          const rect = el.getBoundingClientRect();
          const h = Math.round(rect.height);
          el.style.height = `${h}px`;
        } catch {
          void 0;
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
