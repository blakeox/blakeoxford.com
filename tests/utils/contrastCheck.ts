import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { Rgb, ThemeMode } from './colorContrast';
import { contrastRatio } from './colorContrast';

export type ContrastCheckOptions = {
  route: string;
  theme: ThemeMode;
  selectors?: readonly string[];
  maxPerSelector?: number;
  sentinelBand?: number;
};

export type ContrastCheckResult = {
  sampled: number;
  borderline: Array<{
    sel: string;
    ratio: number;
    min: number;
    large: boolean;
    classes: string;
  }>;
};

const DEFAULT_SELECTORS = [
  'h1',
  'h2',
  'header nav .nav-link',
  'main p',
  '.btn, button',
  'footer',
  '.prose blockquote',
  'main li',
  '.card',
] as const;

const SKIP_CONTAINER = '[data-a11y-allow-color-contrast], [role="alert"]';

export async function runContrastCheck(
  page: Page,
  options: ContrastCheckOptions,
): Promise<ContrastCheckResult> {
  const {
    route,
    theme,
    selectors = DEFAULT_SELECTORS,
    maxPerSelector = 5,
    sentinelBand = parseFloat(process.env.CONTRAST_SENTINEL_BAND || '0.10'),
  } = options;

  const borderline: ContrastCheckResult['borderline'] = [];
  let sampled = 0;

  for (const sel of selectors) {
    const handles = await page.locator(sel).elementHandles();
    for (const handle of handles.slice(0, maxPerSelector)) {
      const isInsideSkip = await handle.evaluate((node, skipSelector) => {
        let cur: HTMLElement | null = node as HTMLElement;
        while (cur) {
          if (cur.matches?.(skipSelector as string)) return true;
          cur = cur.parentElement;
        }
        return false;
      }, SKIP_CONTAINER);
      if (isInsideSkip) continue;

      // Closed overlays / offscreen chrome should not pollute text-contrast samples.
      const isVisible = await handle.evaluate((node) => {
        const el = node as HTMLElement;
        if (typeof el.checkVisibility === 'function') {
          return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
        }
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0;
      });
      if (!isVisible) continue;

      // WCAG 1.4.3 is about painted text. Empty dismiss/scrim controls (aria-label only)
      // are not text contrast targets; icon buttons (svg/img) still are.
      const hasPaintedContent = await handle.evaluate((node) => {
        const el = node as HTMLElement;
        if ((el.innerText || '').trim().length > 0) return true;
        return Boolean(el.querySelector('svg, img, canvas, video'));
      });
      if (!hasPaintedContent) continue;

      const isTransparentText = await handle.evaluate((node) => {
        const cs = window.getComputedStyle(node);
        return cs.color === 'rgba(0, 0, 0, 0)' || cs.webkitTextFillColor === 'transparent';
      });
      if (isTransparentText) continue;

      const metrics = await handle.evaluate((node) => {
        if (typeof window.__resolveCssColorToRgb !== 'function') {
          return null;
        }
        const style = window.getComputedStyle(node);
          let bg = style.backgroundColor;
          const lineage: string[] = [];
          let cur: HTMLElement | null = node;
          while (bg === 'rgba(0, 0, 0, 0)' && cur?.parentElement) {
            const parentStyle = window.getComputedStyle(cur.parentElement);
            lineage.push(
              `${cur.parentElement.tagName.toLowerCase()}.${cur.parentElement.className}`.trim(),
            );
            bg = parentStyle.backgroundColor;
            cur = cur.parentElement;
          }

          const resolve = window.__resolveCssColorToRgb;
          const fgRgb = resolve(style.color, 'color');
          const bgRgb = resolve(bg, 'background');

          return {
            fgRgb,
            bgRgb,
            fg: style.color,
            bg,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            className: node.className,
            lineage: lineage.slice(0, 6),
          };
        },
      );

      if (!metrics) {
        throw new Error('Color contrast resolver not initialized (__resolveCssColorToRgb missing)');
      }

      const fg = (metrics.fgRgb ?? [0, 0, 0]) as Rgb;
      const bg = (metrics.bgRgb ?? [255, 255, 255]) as Rgb;
      const ratio = contrastRatio(fg, bg);

      const large = await handle.evaluate((n) => {
        const cs = window.getComputedStyle(n);
        const size = parseFloat(cs.fontSize);
        const weight = parseInt(cs.fontWeight, 10) || 400;
        return size >= 24 || (size >= 18.66 && weight >= 700);
      });
      const min = large ? 3.0 : 4.5;

      const debug = ` theme=${theme} fg=${metrics.fg} bg=${metrics.bg} fgRgb=${fg.join(',')} bgRgb=${bg.join(',')} size=${metrics.fontSize} weight=${metrics.fontWeight} classes="${metrics.className}" lineage=${metrics.lineage.join('>')}`;

      if (ratio >= min && ratio < min + sentinelBand) {
        borderline.push({ sel, ratio, min, large, classes: metrics.className });
      }

      expect(
        ratio,
        `Contrast ${ratio.toFixed(2)} < ${min} for selector ${sel} on ${route}.${debug}`,
      ).toBeGreaterThanOrEqual(min);
      sampled++;
    }
  }

  return { sampled, borderline };
}

export async function assertHeroCtaContrast(page: Page, route: string, theme: ThemeMode): Promise<void> {
  const cta = page.locator('[data-test="home-cta-connect"]').first();
  await expect(cta).toBeVisible();

  const ratio = await page.evaluate(() => {
    const el = document.querySelector('[data-test="home-cta-connect"]') as HTMLElement | null;
    if (!el || typeof window.__resolveCssColorToRgb !== 'function') return 0;
    const resolve = window.__resolveCssColorToRgb;
    const cs = window.getComputedStyle(el);
    let bgColor = cs.backgroundColor;
    let cur: HTMLElement | null = el;
    while (bgColor === 'rgba(0, 0, 0, 0)' && cur?.parentElement) {
      bgColor = window.getComputedStyle(cur.parentElement).backgroundColor;
      cur = cur.parentElement;
    }
    const fg = resolve(cs.color, 'color') ?? [0, 0, 0];
    const bg = resolve(bgColor, 'background') ?? [255, 255, 255];
    const L = (r: number, g: number, b: number) => {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    };
    const L1 = L(fg[0], fg[1], fg[2]);
    const L2 = L(bg[0], bg[1], bg[2]);
    const light = Math.max(L1, L2);
    const dark = Math.min(L1, L2);
    return (light + 0.05) / (dark + 0.05);
  });

  expect(ratio, `Hero CTA contrast ${ratio.toFixed(2)} < 4.5 (${theme} on ${route})`).toBeGreaterThanOrEqual(4.5);
}

// Re-export selectors for sitemap spec
export { DEFAULT_SELECTORS as SAMPLE_CONTRAST_SELECTORS, SKIP_CONTAINER as CONTRAST_SKIP_CONTAINER };
