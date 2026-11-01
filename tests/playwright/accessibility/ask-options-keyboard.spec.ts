import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

for (const viewport of [
  { width: 390, height: 844 },
  { width: 600, height: 320 },
  { width: 1440, height: 1000 },
]) {
  test(`Ask options remain reachable by keyboard at ${viewport.width}px @essential`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/blog/');
    await page.getByRole('button', { name: 'Open Ask' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ask', exact: true });
    const toggle = dialog.getByRole('button', { name: 'Assistant options' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    const enabledItems = menu.locator('[role="menuitem"]:not(:disabled)');
    // Voice support may add a command after opening; preserve the chosen item.
    await expect(menu.locator('[role="menuitem"]:focus')).toHaveCount(1);
    await page.keyboard.press('Home');
    await expect(enabledItems.first()).toBeFocused();
    expect(
      await dialog.evaluate((panel) => panel.contains(document.querySelector('[role="menu"]')))
    ).toBe(true);
    await page.keyboard.press('ArrowDown');
    await expect(enabledItems.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(
      menu.getByRole('menuitem', { name: 'Session settings', exact: true })
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(
      menu.getByRole('menuitem', { name: 'Hide session settings', exact: true })
    ).toBeFocused();
    await expect(menu.getByRole('menuitem', { name: 'Export chat', exact: true })).toBeDisabled();
    await expect(menu.getByRole('menuitem', { name: 'Clear chat', exact: true })).toBeDisabled();
    const menuBox = await menu.boundingBox();
    const panelBox = await dialog.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(menuBox!.y).toBeGreaterThanOrEqual(panelBox!.y);
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(panelBox!.y + panelBox!.height + 1);
    expect(menuBox!.x).toBeGreaterThanOrEqual(0);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewport.width);
    const audit = await new AxeBuilder({ page })
      .include('[role="menu"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(dialog).toBeVisible();
    const settingsAudit = await new AxeBuilder({ page })
      .include('[data-ai-chat-panel]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(settingsAudit.violations).toEqual([]);
    await page.keyboard.press('Enter');
    await expect(enabledItems.first()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(menu).toBeHidden();
    expect(await dialog.evaluate((panel) => panel.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open Ask' })).toBeFocused();
  });
}
