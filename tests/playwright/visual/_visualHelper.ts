import { expect, Page } from '@playwright/test';
import { VISUAL_ROUTE_CONFIG, type RouteCfg, type DiffCfg, MAX_ALLOWED_TOLERANCE } from './config';

export async function preparePage(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
}

// Waits for the page's scroll height to remain stable for a short period.
async function waitForStableLayout(page: Page, opts: { timeoutMs?: number; stableForMs?: number } = {}) {
  const timeoutMs = opts.timeoutMs ?? 4000;
  const stableForMs = opts.stableForMs ?? 250;

  const start = Date.now();
  let lastH = await page.evaluate(() => document.scrollingElement?.scrollHeight || document.body.scrollHeight || 0);
  let lastChange = Date.now();

  // Poll for stability
  while (Date.now() - start < timeoutMs) {
    await page.waitForTimeout(50);
    const h = await page.evaluate(() => document.scrollingElement?.scrollHeight || document.body.scrollHeight || 0);
    if (h !== lastH) {
      lastH = h;
      lastChange = Date.now();
      continue;
    }
    if (Date.now() - lastChange >= stableForMs) return; // stable long enough
  }
}

export async function snapshotRoute(
  page: Page,
  route: string,
  opts: { mask?: string[]; diff?: DiffCfg } = {}
) {
  // Avoid networkidle on most pages with lazy widgets; DOMContentLoaded is enough for static capture
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  // Contact page: wait for load to stabilize layout without risking perpetual network activity.
  if (route === '/contact/' || route === '/about/' || route === '/projects/') {
    await page.waitForLoadState('load');
  }
  // Ensure web fonts are fully loaded before we check for layout stability, otherwise
  // Playwright will wait for fonts during screenshot and the page height can change after
  // our stability check (seen as intermittent fullPage height diffs, especially on Firefox).
  await page.evaluate(async () => {
    try {
      if (document.fonts && 'ready' in document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      // no-op: font readiness is a best-effort optimization
    }
  });
  // In all cases, wait briefly for layout height to stabilize to avoid full-page height drift
  const stableOpts =
    route === '/contact/'
      ? { timeoutMs: 6000, stableForMs: 400 }
      : route === '/blog/'
      ? { timeoutMs: 6000, stableForMs: 400 }
      : undefined;
  await waitForStableLayout(page, stableOpts);
  await expect(page.locator('main, [role="main"]').first()).toBeVisible();

  // Derive route-specific config with safe defaults
  const baseCfg: RouteCfg = { ...(VISUAL_ROUTE_CONFIG[route] || { diff: { maxDiffPixelRatio: 0.01 } }) };
  if (opts.diff) baseCfg.diff = { ...(baseCfg.diff || {}), ...opts.diff };
  if (opts.mask?.length) baseCfg.mask = [...(baseCfg.mask || []), ...opts.mask];

  // Chrome-specific variance bump for contact page (text/blur rendering)
  if (route === '/contact/') {
    const ua = (await page.evaluate(() => navigator.userAgent)) || '';
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
      baseCfg.diff = {
        ...(baseCfg.diff || {}),
        maxDiffPixelRatio: Math.max(baseCfg.diff?.maxDiffPixelRatio || 0, 0.025),
      };
    }
  }

  // Enforce maximum tolerance guardrail
  if ((baseCfg.diff?.maxDiffPixelRatio || 0) > MAX_ALLOWED_TOLERANCE) {
    baseCfg.diff = { ...(baseCfg.diff || {}), maxDiffPixelRatio: MAX_ALLOWED_TOLERANCE };
  }

  const rawName = route.replace(/\/$/, '').replace(/\//g, '_').replace(/^_/, '');
  const fileName = (rawName || 'home') + '.png';

  await expect(page).toHaveScreenshot(fileName, {
    animations: 'disabled',
    fullPage: baseCfg.fullPage !== false,
    mask: (baseCfg.mask || []).map((sel) => page.locator(sel)),
    maskColor: '#ffffff',
    maxDiffPixelRatio: baseCfg.diff?.maxDiffPixelRatio,
    maxDiffPixels: baseCfg.diff?.maxDiffPixels,
    timeout: 10000,
  });
}
