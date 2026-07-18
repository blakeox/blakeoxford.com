/**
 * Client enricher for /design/tokens — resolved CSS values + WCAG contrast pairs.
 * Runs in the browser so OKLCH + dark remaps resolve through the live cascade.
 */

type Rgb = [number, number, number];

const CONTRAST_PAIRS: Array<{ fg: string; bg: string; label: string }> = [
  { fg: '--color-on-accent', bg: '--color-accent', label: 'on-accent / accent' },
  { fg: '--color-foreground', bg: '--color-background', label: 'foreground / background' },
  {
    fg: '--color-muted-foreground',
    bg: '--color-background',
    label: 'muted-foreground / background',
  },
  {
    fg: '--color-subtle-foreground',
    bg: '--color-background',
    label: 'subtle-foreground / background',
  },
];

function luminance(r: number, g: number, b: number): number {
  const channel = [r, g, b].map((v) => {
    const normalized = v / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

function contrastRatio(fg: Rgb, bg: Rgb): number {
  const fgL = luminance(fg[0], fg[1], fg[2]);
  const bgL = luminance(bg[0], bg[1], bg[2]);
  const lighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgbString(raw: string): Rgb | null {
  if (!raw) return null;
  const val = raw.trim().toLowerCase();
  const hexMatch = val.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgbMatch = val.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*(?:,|\s)\s*(\d+(?:\.\d+)?)\s*(?:,|\s|\/)\s*(\d+(?:\.\d+)?)/i
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

function resolveCssColorToRgb(cssColor: string): Rgb | null {
  if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') return null;
  const direct = parseRgbString(cssColor);
  if (direct) return direct;
  const el = document.createElement('div');
  el.style.color = cssColor;
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  el.remove();
  return parseRgbString(computed);
}

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function themeLabel(): string {
  const root = document.documentElement;
  if (root.getAttribute('data-theme') === 'dark' || root.classList.contains('dark')) return 'dark';
  return 'light';
}

function refreshResolvedValues(): void {
  document.querySelectorAll<HTMLElement>('[data-token-var]').forEach((el) => {
    const token = el.dataset.tokenVar;
    if (!token) return;
    const value = readToken(token);
    el.textContent = value || '—';
  });
}

function refreshContrastPairs(): void {
  const host = document.getElementById('token-contrast-pairs');
  if (!host) return;
  const mode = themeLabel();
  const rows = CONTRAST_PAIRS.map(({ fg, bg, label }) => {
    const fgRaw = readToken(fg);
    const bgRaw = readToken(bg);
    const fgRgb = resolveCssColorToRgb(fgRaw);
    const bgRgb = resolveCssColorToRgb(bgRaw);
    const ratio = fgRgb && bgRgb ? contrastRatio(fgRgb, bgRgb) : null;
    const pass = ratio != null && ratio >= 4.5;
    const largePass = ratio != null && ratio >= 3;
    const ratioText = ratio != null ? `${ratio.toFixed(2)}:1` : 'n/a';
    const badge = ratio == null ? 'unknown' : pass ? 'AA' : largePass ? 'AA large' : 'fail';
    return `<tr>
      <td class="px-4 py-3 font-medium text-foreground">${label}</td>
      <td class="px-4 py-3 text-muted-foreground">${mode}</td>
      <td class="px-4 py-3"><code class="text-xs">${fgRaw || '—'}</code></td>
      <td class="px-4 py-3"><code class="text-xs">${bgRaw || '—'}</code></td>
      <td class="px-4 py-3 font-semibold ${pass ? 'text-success-emphasis' : 'text-error-emphasis'}">${ratioText}</td>
      <td class="px-4 py-3 text-sm">${badge}</td>
    </tr>`;
  });
  host.innerHTML = rows.join('');
}

export function initTokenLiveValues(): void {
  const run = () => {
    refreshResolvedValues();
    refreshContrastPairs();
  };
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class'],
  });
}
