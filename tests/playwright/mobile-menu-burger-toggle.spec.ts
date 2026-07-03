import { test, expect } from './fixtures';
import { waitForMenuState } from '../utils/waits';

test.describe('Mobile menu close via burger toggle', () => {
  test('opens and closes using the hamburger button without flake', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const burger = page.locator('#nav-toggle.burger-menu-button');
    const menu = page.locator('#nav-mobile-links, .mobile-menu').first();

    await expect(burger).toBeVisible();
    await burger.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', true, 1500);
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(burger).toHaveAttribute('aria-label', 'Close navigation menu');
    await expect(page.locator('#nav-mobile-backdrop')).toHaveAttribute('data-state', 'open');

    await burger.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', false, 1500);
    await expect(burger).toHaveAttribute('aria-expanded', 'false');

    const isMenuClosed = await menu.evaluate((el) => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isHidden = styles.visibility === 'hidden' || styles.display === 'none';
      return !hasActiveClass || isHidden;
    });
    expect(isMenuClosed).toBe(true);
  });
});
