import { test, expect } from '../fixtures';

for (const theme of ['light', 'dark'] as const) {
  test(`field boundaries remain identifiable in ${theme}`, async ({ page }) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('theme', theme);
      (window as Window & { __AUDIT__?: boolean }).__AUDIT__ = true;
    }, theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/contact/');
    const field = page.locator('#email');
    await expect(field).toBeVisible();
    for (const state of ['default', 'hover', 'focus']) {
      if (state === 'hover') await field.hover();
      if (state === 'focus') await field.focus();
      const ratio = await field.evaluate((element) => {
        const style = getComputedStyle(element);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d')!;
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, 1, 1);
        const background = context.getImageData(0, 0, 1, 1).data;
        context.fillStyle = style.borderTopColor;
        context.fillRect(0, 0, 1, 1);
        const border = context.getImageData(0, 0, 1, 1).data;
        const luminance = (color: Uint8ClampedArray) =>
          Array.from(color)
            .slice(0, 3)
            .map((channel) => channel / 255)
            .map((channel) =>
              channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
            )
            .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
        const first = luminance(background);
        const second = luminance(border);
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      });
      expect(ratio, `${theme} ${state} boundary contrast`).toBeGreaterThanOrEqual(3);
    }
  });
}
