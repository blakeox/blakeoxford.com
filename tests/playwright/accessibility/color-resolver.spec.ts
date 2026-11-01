import { test, expect } from '../fixtures';
import { RESOLVE_CSS_COLOR_FN } from '../../utils/colorContrast';

for (const theme of ['light', 'dark'] as const) {
  test(`contrast color resolver matches browser painting in ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await page.goto('/contact/');
    await page.addScriptTag({ content: RESOLVE_CSS_COLOR_FN });
    const samples = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const colors = [
        'oklab(0.5 0 0)',
        'oklch(0.5 0 0)',
        'oklch(0.16 0.02 250)',
        ...['--color-foreground', '--color-background', '--color-field-border'].map((token) =>
          style.getPropertyValue(token).trim()
        ),
      ];
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      return colors.map((color) => {
        const probe = document.createElement('span');
        probe.style.color = color;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = resolved;
        context.fillRect(0, 0, 1, 1);
        return {
          color,
          expected: Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3),
          actual: (window as any).__resolveCssColorToRgb(resolved),
        };
      });
    });
    for (const sample of samples) {
      expect(sample.color).not.toBe('');
      expect(sample.actual, sample.color).not.toBeNull();
      sample.expected.forEach((channel, index) =>
        expect(Math.abs(sample.actual[index] - channel), sample.color).toBeLessThanOrEqual(1)
      );
    }
    expect(samples[0].actual).toEqual([99, 99, 99]);
  });
}
