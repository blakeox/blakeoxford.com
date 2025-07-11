const { test, expect } = require('@playwright/test');

test('nav-toggle button focus test', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const navToggle = page.locator('#nav-toggle');

  // Check if button exists and is visible
  await expect(navToggle).toBeVisible();

  // Check if button is attached to DOM
  await expect(navToggle).toBeAttached();

  // Check if button is enabled
  await expect(navToggle).toBeEnabled();

  // Get computed styles
  const computedStyles = await navToggle.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      display: styles.display,
      visibility: styles.visibility,
      pointerEvents: styles.pointerEvents,
      position: styles.position,
      zIndex: styles.zIndex,
      opacity: styles.opacity
    };
  });

  console.log('Computed styles:', computedStyles);

  // Try to focus
  await navToggle.focus();

  // Wait a bit
  await page.waitForTimeout(100);

  // Check if focused
  const isFocused = await navToggle.evaluate(el => document.activeElement === el);
  console.log('Is focused:', isFocused);

  if (!isFocused) {
    // Check what element actually has focus
    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        id: el?.id,
        className: el?.className,
        outerHTML: el?.outerHTML?.substring(0, 200)
      };
    });
    console.log('Active element:', activeElement);
  }

  // Try clicking and then checking focus
  await navToggle.click();
  await page.waitForTimeout(100);

  const isFocusedAfterClick = await navToggle.evaluate(el => document.activeElement === el);
  console.log('Is focused after click:', isFocusedAfterClick);
});
