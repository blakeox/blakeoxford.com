import { test, expect } from '../fixtures';

for (const width of [390, 1440]) {
  test(`keyboard focus survives forced colors at ${width}px`, async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'This gate uses Chromium forced-colors emulation; native platform testing is separate.'
    );
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.goto('/');
    const visited = new Set<string>();
    let footerTargets = 0;
    for (let index = 0; index < 38; index++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement;
        if (!element.matches('a, button, input, textarea, select, [role="button"]')) return null;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          name: element.getAttribute('aria-label') || element.textContent?.trim() || '',
          href: element.getAttribute('href'),
          outline: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
          footer: !!element.closest('footer'),
          visible: rect.width > 0 && rect.height > 0,
        };
      });
      if (!focused) continue;
      expect(focused.visible).toBe(true);
      expect(focused.outline, focused.name).not.toBe('none');
      expect(focused.width, focused.name).toBeGreaterThanOrEqual(2);
      visited.add(`${focused.name}:${focused.href}`);
      if (focused.footer) footerTargets++;
    }
    expect(visited.size).toBeGreaterThanOrEqual(20);
    expect(footerTargets).toBeGreaterThanOrEqual(5);
  });
}
