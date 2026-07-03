import { test, expect } from '@playwright/test';

/**
 * Production-faithful menu visibility checks.
 * Uses plain Playwright (no test fixture overrides) so failures match real UX.
 */
test.describe('Menu visibility (production-faithful)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('mobile nav links are visible when menu is open', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => (window as Window & { __navHydrated?: boolean }).__navHydrated === true, {
      timeout: 5000,
    });

    const menu = page.locator('#nav-mobile-links');
    const firstLink = menu.locator('.mobile-nav-link').first();

    await page.locator('#nav-toggle').click();
    await expect(menu).toHaveClass(/active/);
    await expect(page.locator('#nav-mobile-backdrop')).toHaveAttribute('data-state', 'open');
    const backdropVisible = await page.locator('#nav-mobile-backdrop').evaluate((el) => {
      const style = getComputedStyle(el);
      return style.display !== 'none' && parseFloat(style.opacity) > 0.4;
    });
    expect(backdropVisible).toBe(true);

    const metrics = await page.evaluate(() => {
      const el = document.getElementById('nav-mobile-links');
      const link = el?.querySelector('.mobile-nav-link') as HTMLElement | null;
      if (!el || !link) return null;
      const menuStyle = getComputedStyle(el);
      const linkBox = link.getBoundingClientRect();
      return {
        maxHeight: menuStyle.maxHeight,
        visibility: menuStyle.visibility,
        opacity: menuStyle.opacity,
        menuHeight: el.getBoundingClientRect().height,
        linkHeight: linkBox.height,
        linkWidth: linkBox.width,
        linkTop: linkBox.top,
        linkBottom: linkBox.bottom,
        viewportHeight: window.innerHeight,
        inlineVisibility: el.style.visibility,
        inert: (el as HTMLElement & { inert?: boolean }).inert,
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.menuHeight).toBeGreaterThan(40);
    expect(metrics!.linkHeight).toBeGreaterThan(20);
    expect(metrics!.linkWidth).toBeGreaterThan(20);
    expect(metrics!.visibility).toBe('visible');
    expect(parseFloat(metrics!.opacity)).toBeGreaterThan(0.5);
    expect(metrics!.linkTop).toBeGreaterThanOrEqual(0);
    expect(metrics!.linkBottom).toBeLessThanOrEqual(metrics!.viewportHeight + 1);

    await expect(firstLink).toBeVisible();

    // Menu links must sit above hero content (Safari sticky/absolute stacking bug).
    const hitTest = await page.evaluate(() => {
      const link = document.querySelector('#nav-mobile-links .mobile-nav-link') as HTMLElement | null;
      if (!link) return { ok: false, reason: 'missing-link' };
      const rect = link.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      return {
        ok: Boolean(hit?.closest('#nav-mobile-links')),
        hitTag: hit?.tagName ?? null,
        menuZ: getComputedStyle(document.getElementById('nav-mobile-links')!).zIndex,
      };
    });
    expect(hitTest.ok).toBe(true);
    expect(Number.parseInt(hitTest.menuZ, 10)).toBeGreaterThanOrEqual(1000);
  });

  test('chat overflow menu is visible when opened', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('.ai-chat-launcher').click();
    await expect(page.locator('[data-ai-chat-panel][data-ai-visible="true"]')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Assistant options' }).click();
    await expect(page.getByRole('button', { name: 'Assistant options' })).toHaveAttribute('aria-expanded', 'true');

    const menu = page.locator('body > [role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /Memory/i })).toBeVisible();

    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(40);
    expect(box!.width).toBeGreaterThan(80);
  });
});
