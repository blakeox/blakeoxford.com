/**
 * Shared color-contrast helpers for Playwright accessibility specs.
 * Resolves modern CSS color formats (OKLCH, color-mix, etc.) to sRGB via the browser.
 */

export type Rgb = [number, number, number];

export function luminance(r: number, g: number, b: number): number {
  const channel = [r, g, b].map((v) => {
    const normalized = v / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const fgL = luminance(fg[0], fg[1], fg[2]);
  const bgL = luminance(bg[0], bg[1], bg[2]);
  const lighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return (lighter + 0.05) / (darker + 0.05);
}

export function parseRgbString(raw: string): Rgb | null {
  if (!raw) return null;
  const val = raw.trim().toLowerCase();

  const hexMatch = val.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) {
      h = h.split('').map((c) => c + c).join('');
    }
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const rgbMatch = val.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*(?:,|\s)\s*(\d+(?:\.\d+)?)\s*(?:,|\s|\/)\s*(\d+(?:\.\d+)?)/i,
  );
  if (rgbMatch) {
    return [
      Math.round(parseFloat(rgbMatch[1])),
      Math.round(parseFloat(rgbMatch[2])),
      Math.round(parseFloat(rgbMatch[3])),
    ];
  }

  return null;
}

/** Injected into page.evaluate – must be self-contained (no imports). */
export const RESOLVE_CSS_COLOR_FN = `
window.__resolveCssColorToRgb = function(cssColor, property) {
  if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') {
    return null;
  }

  function parseRgbString(raw) {
    if (!raw) return null;
    var val = String(raw).trim().toLowerCase();
    var hexMatch = val.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      var h = hexMatch[1];
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    var rgbMatch = val.match(/rgba?\\(\\s*([\\d.]+)\\s*(?:,|\\s)\\s*([\\d.]+)\\s*(?:,|\\s|\\/)\\s*([\\d.]+)/i);
    if (rgbMatch) {
      return [Math.round(parseFloat(rgbMatch[1])), Math.round(parseFloat(rgbMatch[2])), Math.round(parseFloat(rgbMatch[3]))];
    }
    var srgbMatch = val.match(/color\\(\\s*srgb\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)/i);
    if (srgbMatch) {
      return [
        Math.round(parseFloat(srgbMatch[1]) * 255),
        Math.round(parseFloat(srgbMatch[2]) * 255),
        Math.round(parseFloat(srgbMatch[3]) * 255),
      ];
    }
    return null;
  }

  function oklabToRgb(L, a, b) {
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    var s_ = L - 0.0894841775 * a - 1.291485548 * b;
    var l = l_ * l_ * l_;
    var m = m_ * m_ * m_;
    var s = s_ * s_ * s_;
    return [
      Math.round(255 * Math.max(0, Math.min(1, 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s))),
      Math.round(255 * Math.max(0, Math.min(1, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s))),
      Math.round(255 * Math.max(0, Math.min(1, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s))),
    ];
  }

  var direct = parseRgbString(cssColor);
  if (direct) return direct;

  var oklabMatch = String(cssColor).match(/oklab\\(\\s*([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)/i);
  if (oklabMatch) {
    return oklabToRgb(parseFloat(oklabMatch[1]), parseFloat(oklabMatch[2]), parseFloat(oklabMatch[3]));
  }

  try {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#010203';
      ctx.fillStyle = cssColor;
      var hex = ctx.fillStyle;
      if (typeof hex === 'string' && hex.charAt(0) === '#') {
        var hx = hex.length === 4
          ? hex.slice(1).split('').map(function (c) { return c + c; }).join('')
          : hex.slice(1);
        return [
          parseInt(hx.slice(0, 2), 16),
          parseInt(hx.slice(2, 4), 16),
          parseInt(hx.slice(4, 6), 16),
        ];
      }
    }
  } catch (err) { /* noop */ }

  var probe = document.createElement('span');
  probe.style.cssText = 'position:fixed;left:-9999px;visibility:hidden;pointer-events:none;';
  if (property === 'background') {
    probe.style.backgroundColor = cssColor;
  } else {
    probe.style.color = cssColor;
  }
  document.documentElement.appendChild(probe);
  var cs = getComputedStyle(probe);
  var resolved = property === 'background' ? cs.backgroundColor : cs.color;
  probe.remove();

  var fromProbe = parseRgbString(resolved);
  if (fromProbe) return fromProbe;

  var probeOklab = String(resolved).match(/oklab\\(\\s*([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)/i);
  if (probeOklab) {
    return oklabToRgb(parseFloat(probeOklab[1]), parseFloat(probeOklab[2]), parseFloat(probeOklab[3]));
  }

  return [0, 0, 0];
};
`;

export const SAMPLE_CONTRAST_SELECTORS = [
  'h1',
  'h2',
  'header nav a',
  'main p',
  '.btn, button',
  'footer',
  '.prose blockquote',
  'main li',
  '.card',
] as const;

export const CONTRAST_SKIP_CONTAINER =
  '[data-a11y-allow-color-contrast], [role="alert"]';

export type ThemeMode = 'light' | 'dark';

/** Force a theme on the document (call after navigation). */
export async function applyThemeOnPage(
  page: import('@playwright/test').Page,
  theme: ThemeMode,
): Promise<void> {
  await page.evaluate((nextTheme) => {
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme;
    // Pause theme token transitions so contrast samples settle immediately
    root.style.setProperty('transition', 'none');
    try {
      localStorage.setItem('theme', nextTheme);
      document.cookie = `theme=${encodeURIComponent(nextTheme)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    } catch {
      /* noop */
    }
    for (const prop of ['--color-background', '--color-foreground', '--bg', '--fg']) {
      root.style.removeProperty(prop);
    }
  }, theme);

  // Allow islands to hydrate, then re-apply and let any @property transitions finish
  await page.waitForTimeout(150);
  await page.evaluate((nextTheme) => {
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme;
    root.style.setProperty('transition', 'none');
    for (const prop of ['--color-background', '--color-foreground', '--bg', '--fg']) {
      root.style.removeProperty(prop);
    }
  }, theme);

  await page.waitForTimeout(350);

  await page.waitForFunction(
    (expected) => {
      const root = document.documentElement;
      if (root.getAttribute('data-theme') !== expected) return false;
      const fg = getComputedStyle(root).getPropertyValue('--color-foreground').trim();
      if (!fg) return false;
      // Light mode foreground is dark (L < 50%); dark mode foreground is light (L > 50%)
      const match = fg.match(/oklch\(\s*([\d.]+)%?/i);
      if (!match) return true;
      const lightness = parseFloat(match[1]);
      const normalized = fg.includes('%') ? lightness : lightness * 100;
      return expected === 'dark' ? normalized > 50 : normalized < 50;
    },
    theme,
    { timeout: 3000 },
  );
}
