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
    // Close overlay via programmatic helper if available, else fall back to Escape key
    const hasCloseHelper = await page.evaluate(() => !!(window as any).enhancedSearchOverlay?.closeSearchOverlay);
    if (hasCloseHelper) {
      await page.evaluate(() => (window as any).enhancedSearchOverlay.closeSearchOverlay());
    } else {
      // Fallback: dispatch a DOM keyboard event to trigger in-page handlers instead of Playwright's keyboard.press
      await page.evaluate(() => {
        try {
          const ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
          document.dispatchEvent(ev);
        } catch (e) { /* noop */ }
      });
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
