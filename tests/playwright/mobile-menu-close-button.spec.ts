import { test, expect } from '@playwright/test';
import { waitForMenuState } from '../utils/waits';

test.describe('Mobile menu close via button', () => {
  test('opens and closes using the close button without flake', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const burger = page.locator('#nav-toggle.burger-menu-button');
    const menu = page.locator('#nav-mobile-links, .mobile-menu').first();
    const closeBtn = page.locator('#close-mobile-menu');

    await expect(burger).toBeVisible();
    await burger.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', true, 1500);

    // Ensure the panel captures clicks and the close button is interactable
    await expect(closeBtn).toBeVisible();
    await closeBtn.click({ trial: false });

    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', false, 1500);
    // Verify closed using robust heuristics and aria state rather than only class
  const burgerAfter = page.locator('#nav-toggle');
  await expect(burgerAfter).toHaveAttribute('aria-expanded', 'false');
    const isMenuClosed = await menu.evaluate(el => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isHidden = styles.visibility === 'hidden' || styles.display === 'none';
      const hasHiddenTransform = styles.right === '-100vw' || styles.transform?.includes('-100');
      return !hasActiveClass || isHidden || hasHiddenTransform;
    });
    expect(isMenuClosed).toBe(true);
  });
});
