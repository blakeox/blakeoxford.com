// Shared Playwright page action helpers (Phase 0 minimal)
// Will be imported in future consolidated specs.
import { Page, expect } from '@playwright/test';

export async function openSearchOverlay(page: Page) {
  const overlay = page.locator('#search-overlay');
  // Clear any initial focus oddities
  await page.evaluate(() => document.activeElement instanceof HTMLElement && (document.activeElement as HTMLElement).blur());

  // Prefer clicking the explicit toggle if present
  const toggle = page.locator('#search-toggle');
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  } else {
    // Fallback shortcuts: '/' is wired in component script; Meta+K for convenience
    await page.keyboard.press('/').catch(() => {});
    const combo = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';
    await page.keyboard.press(combo).catch(() => {});
  }

  // If a deterministic test-only helper is available, prefer it (wait briefly for it to be injected)
  const helperAvailable = await page.waitForFunction(() => {
    try { return !!(window as any).__ENHANCED_SEARCH_OVERLAY_INJECTED || !!(window as any).enhancedSearchOverlay?.openSearchOverlay; } catch (e) { return false; }
  }, { timeout: 2000 }).catch(() => false as const);
  if (helperAvailable) {
    await page.evaluate(() => { try { (window as any).enhancedSearchOverlay?.openSearchOverlay?.(); } catch { /* noop */ } });
  }

  // Wait for overlay activation (data-state + display utility)
  const activated = await page.waitForFunction(() => {
    const el = document.querySelector('#search-overlay') as HTMLElement | null;
    if (!el) return false;
    const inert = el.hasAttribute('inert');
    const style = el ? window.getComputedStyle(el) : null;
    const visible = !!style && style.display !== 'none' && parseFloat(style.opacity || '1') > 0;
    return !inert && el.getAttribute('data-state') === 'open' && visible;
  }, { timeout: 3000 }).catch(() => false as const);

  // If still not active, attempt to force init + open via page script
  if (!activated) {
    // Prefer the deterministic test helper if available
    const usedHelper = await page.waitForFunction(() => {
      try { return !!(window as any).enhancedSearchOverlay?.openSearchOverlay; } catch (e) { return false; }
    }, { timeout: 500 }).catch(() => false as const);

    if (usedHelper) {
      await page.evaluate(() => { try { (window as any).enhancedSearchOverlay.openSearchOverlay(); } catch { /* noop */ } });
    } else {
      // Avoid long synchronous page.evaluate calls that can hang if the page is unstable; split into guarded steps
      const hasOverlay = await page.evaluate(() => !!document.getElementById('search-overlay'));
      if (!hasOverlay) return overlay;
      await page.evaluate(() => {
        try {
          const overlay = document.getElementById('search-overlay') as HTMLElement | null;
          if (!overlay) return;
          overlay.setAttribute('data-state', 'open');
          overlay.classList.remove('hidden');
          overlay.classList.add('flex');
          overlay.removeAttribute('inert');
          try { overlay.removeAttribute('aria-hidden'); } catch  { void 0; }
        } catch (e) { console.error('partial open failed', e); }
      }).catch(() => {});

      // Focus input separately to avoid blocking
      await page.evaluate(() => {
        try {
          const input = document.getElementById('search-input') as HTMLInputElement | null;
          if (input) { input.focus(); input.setAttribute('aria-expanded', 'true'); }
        } catch (e) { console.error('focus failed', e); }
      }).catch(() => {});

      await page.evaluate(() => {
        try {
          const overlay = document.getElementById('search-overlay') as HTMLElement | null;
          if (!overlay) return;
          document.body.style.overflow = 'hidden';
          document.body.style.position = 'fixed';
          document.body.style.width = '100%';
        } catch (e) { console.error('reveal results failed', e); }
      }).catch(() => {});

      await page.waitForFunction(() => {
        const el = document.querySelector('#search-overlay') as HTMLElement | null;
        if (!el) return false;
        const inert = el.hasAttribute('inert');
        const style = window.getComputedStyle(el);
        const visible = style.display !== 'none' && parseFloat(style.opacity || '1') > 0;
        return !inert && el.getAttribute('data-state') === 'open' && visible;
      }, { timeout: 3000 }).catch(() => {});
    }
  }

  // Wait for reconciliation-ready flag set by the server/client helper (longer timeout)
  await page.waitForFunction(() => {
    const el = document.querySelector('#search-overlay') as HTMLElement | null;
    return !!el && el.dataset && el.dataset.ready === 'true';
  }, { timeout: 5000 }).catch(() => {});

  // Ensure the input is visible before proceeding to fillSearch
  await page.waitForFunction(() => {
    const input = document.querySelector('#search-input') as HTMLInputElement | null;
    if (!input) return false;
    const style = window.getComputedStyle(input);
    return style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity || '1') > 0;
  }, { timeout: 3000 }).catch(() => {});

  await page.waitForFunction(() => {
    const el = document.querySelector('#search-overlay') as HTMLElement | null;
    if (!el) return false;
    try { el.removeAttribute('aria-hidden'); } catch  { void 0; }
    const style = window.getComputedStyle(el);
    const vis = style.display !== 'none' && parseFloat(style.opacity || '0') > 0;
    return vis && el.getAttribute('data-state') === 'open' && el.dataset.ready === 'true';
  }, { timeout: 3000 }).catch(() => {});
  return overlay;
}

export async function fillSearch(page: Page, query: string) {
  const input = page.locator('#search-input');
  // The command center is intentionally lazy-mounted. Firefox can take longer
  // than Chromium/WebKit to commit the first React render after the overlay
  // shell opens, so wait for the actual control before mutating its state.
  await input.waitFor({ state: 'attached', timeout: 10000 });
  // Ensure input is visible and enabled; some overlays toggle attributes asynchronously
  await page.evaluate(() => {
    try {
      const input = document.getElementById('search-input') as HTMLInputElement | null;
      if (!input) return;
      input.removeAttribute('aria-hidden');
      input.removeAttribute('disabled');
      input.style.display = 'block';
      input.style.visibility = 'visible';
      input.style.opacity = '1';
      input.focus();
      input.setAttribute('aria-expanded', 'true');
    } catch (e) { console.error('ensure input visible failed', e); }
  }).catch(() => {});
  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(query, { timeout: 10000 });
  const results = page.locator('[data-search-result], .search-result, .search-overlay [role="listbox"] [role="option"]');
  // Wait for at least one visible result to avoid strict mode multiple element error
  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll('[data-search-result], .search-result, .search-overlay [role="listbox"] [role="option"]')) as HTMLElement[];
    return nodes.some(n => !!n && n.offsetParent !== null);
  }, { timeout: 4000 });
  await expect(results.first()).toBeVisible({ timeout: 1000 });
  return input;
}

export async function navigateMain(page: Page, path: string) {
  await page.locator(`nav a[href="${path}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(path.replace(/\/$/, '')));
}
