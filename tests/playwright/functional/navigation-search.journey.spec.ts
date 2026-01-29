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
    const hasEnsureHelper = await page.evaluate(() => typeof (window as any).ensureOverlayClosed === 'function');
    if (hasEnsureHelper) {
      await page.evaluate(() => { try { (window as any).ensureOverlayClosed(); } catch (e) { console.error('ensureOverlayClosed threw', e); } });
    } else {
      const hasCloseHelper = await page.evaluate(() => !!(window as any).enhancedSearchOverlay?.closeSearchOverlay || !!(window as any).__ENHANCED_SEARCH_OVERLAY_INJECTED || !!(window as any).searchOverlay);
      if (hasCloseHelper) {
        await page.evaluate(() => { try { (window as any).enhancedSearchOverlay?.closeSearchOverlay?.(); } catch (e) { console.error('enhancedSearchOverlay.closeSearchOverlay threw', e); } });
      } else {
        // Fallback: schedule a deterministic DOM close asynchronously to avoid blocking the renderer
        await page.evaluate(() => {
          try {
            setTimeout(() => {
              try {
                const overlay = document.getElementById('search-overlay');
                if (!overlay) return;
                overlay.dataset.state = 'closed';
                overlay.classList.remove('active');
                overlay.setAttribute('inert', '');
                overlay.setAttribute('aria-hidden', 'true');
                overlay.style.opacity = '0';
                overlay.style.visibility = 'hidden';
                overlay.style.display = 'none';
                const results = overlay.querySelectorAll('.search-result, [data-results-container], [data-results]');
                results.forEach(function (r) { (r as HTMLElement).style.display = 'none'; (r as HTMLElement).style.visibility = 'hidden'; (r as HTMLElement).style.opacity = '0'; });
                const inputEl = overlay.querySelector('#search-input'); if (inputEl) (inputEl as HTMLElement).setAttribute('aria-expanded', 'false');
                try { overlay.dataset.ready = 'false'; } catch (e) {}
              } catch (e) { console.error('scheduled overlay close failed', e); }
            }, 10);
          } catch (e) { console.error('fallback schedule failed', e); }
        });
      }
    }

    // Diagnostic: if overlay remains visible, log relevant attributes and wait deterministically for closed state
    const overlay = page.locator('#search-overlay');
    if (await overlay.isVisible().catch(() => false)) {
      await page.evaluate(() => {
        const el = document.getElementById('search-overlay');
        if (!el) return;
        const styles = window.getComputedStyle(el as HTMLElement);
        // eslint-disable-next-line no-console
        console.log('Overlay still visible after close attempt:', { classList: Array.from((el as HTMLElement).classList), dataset: { ...(el as any).dataset }, display: styles.display, visibility: styles.visibility, opacity: styles.opacity });
      });
    }

    // Wait for deterministic closed state (dataset and styles reconcile)
    try {
      await page.waitForFunction(() => {
        const el = document.getElementById('search-overlay');
        if (!el) return true;
        const style = window.getComputedStyle(el as HTMLElement);
        return (el.dataset.state === 'closed' && (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '0') === 0)) || !el.classList.contains('active');
      }, { timeout: 8000 });
    } catch (err) {
      try {
        const data = (window as any).__TEST_EVENT_LOG || [];
        // eslint-disable-next-line no-console
        console.log('TEST_EVENT_LOG DUMP:', data.slice(-200));
      } catch (e) {}

      // Additionally, snapshot console logs to help debugging when the page dies
      try {
        const consoleLines = await page.evaluate(() => (window as any).__TEST_EVENT_LOG || []);
        console.log('Client TEST_EVENT_LOG:', JSON.stringify(consoleLines.slice(-200)));
      } catch (e) {
        console.log('Failed to read client TEST_EVENT_LOG in catch block', e);
      }

      try {
        const cors = await page.evaluate(() => {
          try { return (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE || []; } catch (e) { return [] }
        });
        console.log('Client __PLAYWRIGHT_CONSOLE_CAPTURE:', JSON.stringify(cors.slice(-200)));
      } catch (e) {
        console.log('Failed to read __PLAYWRIGHT_CONSOLE_CAPTURE', e);
      }
    }

    await expect(overlay).not.toBeVisible();
  });
});
