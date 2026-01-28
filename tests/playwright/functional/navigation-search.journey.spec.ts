import { test, expect } from '@playwright/test';
import { openSearchOverlay, fillSearch, navigateMain } from '../../utils/pageActions';

// Consolidated fast journey combining essential nav + search actions.
// Marked as smoke & journey for selective CI execution.

test.describe('@essential @smoke @journey Navigation & Search Journey', () => {
  test('navigate primary pages', async ({ page }) => {
    await page.goto('/');
    await navigateMain(page, '/about/');
    await navigateMain(page, '/projects/');
    await navigateMain(page, '/blog/');
    await navigateMain(page, '/contact/');
  });

  test('search open, query, and close', async ({ page }) => {
    await page.goto('/');
    await openSearchOverlay(page);
    await fillSearch(page, 'project');
    // Basic assertion: results container exists or empty state still stable
    const results = page.locator('#search-results');
    await expect(results).toBeAttached();
    // Prefer programmatic close helper to avoid Playwright keyboard flakiness; require it in CI
    const hasCloseHelper = await page.evaluate(() => !!(window as any).enhancedSearchOverlay?.closeSearchOverlay || !!(window as any).__ENHANCED_SEARCH_OVERLAY_INJECTED);
    if (hasCloseHelper) {
      await page.evaluate(() => { try { (window as any).enhancedSearchOverlay?.closeSearchOverlay?.(); } catch (e) { console.error('enhancedSearchOverlay.closeSearchOverlay threw', e); } });
    } else {
      // In CI we expect the helper to be present; gather diagnostics and throw
      await page.evaluate(() => {
        // eslint-disable-next-line no-console
        console.error('enhancedSearchOverlay missing:', { enhanced: !!(window as any).enhancedSearchOverlay, injectedFlag: !!(window as any).__ENHANCED_SEARCH_OVERLAY_INJECTED });
        try { console.log('document.readyState', document.readyState); } catch (e) {}
        try { console.log('overlay element', !!document.getElementById('search-overlay')); } catch (e) {}
      });
      throw new Error('Programmatic search overlay helper not available in test environment');
    }
    // Diagnostic: if overlay remains visible, log relevant attributes
    const overlay = page.locator('#search-overlay');
    if (await overlay.isVisible().catch(() => false)) {
      await page.evaluate(() => {
        const el = document.getElementById('search-overlay');
        if (!el) return;
        const styles = window.getComputedStyle(el as HTMLElement);
        // eslint-disable-next-line no-console
        console.log('Overlay still visible after Escape:', { classList: Array.from((el as HTMLElement).classList), dataset: { ...(el as any).dataset }, display: styles.display, visibility: styles.visibility, opacity: styles.opacity });
      });
    }
    await expect(overlay).not.toBeVisible();
  });
});
