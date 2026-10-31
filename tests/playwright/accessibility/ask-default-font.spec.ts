import { test, expect } from '../fixtures';

test('Ask modality follows its layout with enlarged browser-default text @essential', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Changing the browser-default font through CDP is Chromium-only.'
  );
  await page.setViewportSize({ width: 800, height: 1000 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Page.setFontSizes', { fontSizes: { standard: 32, fixed: 26 } });
  await page.goto('/blog/');
  expect(await page.evaluate(() => matchMedia('(min-width: 40rem)').matches)).toBe(false);
  await page.getByRole('button', { name: 'Open Ask' }).click();
  const dialog = page.getByRole('dialog', { name: 'Ask', exact: true });
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(page.locator('body')).toHaveClass(/scroll-locked/);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((panel) => panel.contains(document.activeElement))).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(dialog).toHaveAttribute('aria-modal', 'false');
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await expect(page.locator('body')).not.toHaveClass(/scroll-locked/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open Ask' })).toBeFocused();
});
