import { test, expect } from '@playwright/test';

// Lightweight contrast ratio check for key text elements.
// Tags: @accessibility-extended
// NOTE: This is a heuristic complement to axe-core; axe remains the primary a11y audit.

function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(rgb1: number[], rgb2: number[]) {
  const L1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const L2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}


const sampleSelectors = [
  'h1',
  'h2',
  'header nav a',
  'main p',
  '.btn, button',
  'footer',
  '.prose blockquote',
  'main li',
  '.card'
];

// Minimum contrast ratios: 4.5 for normal text, 3.0 for large (>=24px or >=18.66px bold)

test.describe('@accessibility-extended Contrast Ratios', () => {
  // Include representative detail pages to widen coverage (still lightweight)
  const baseRoutes = [
    '/',
    '/about/',
    '/projects/',
    '/blog/',
    '/projects/google-workspace-migration/',
    '/blog/combating-legal-ai-hallucinations/'
  ];
  // Allow CI to inject rotated detail routes via comma-separated env var
  const injected = (process.env.CONTRAST_EXTRA_ROUTES || '')
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);
  const routes = Array.from(new Set([...baseRoutes, ...injected]));

  for (const route of routes) {
    test(`contrast ratios acceptable ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle'); // settle styles

      const sentinelBand = parseFloat(process.env.CONTRAST_SENTINEL_BAND || '0.10');

      const borderline: Array<{ sel: string; ratio: number; min: number; text: string; classes: string; route: string; large: boolean; }> = [];
      let sampled = 0;

      for (const sel of sampleSelectors) {
        const handles = await page.locator(sel).elementHandles();
        for (const handle of handles.slice(0, 5)) { // cap for speed
          const m = await handle.evaluate((node: any) => {
            const style = window.getComputedStyle(node);
            let bg = style.backgroundColor;
            const lineage: string[] = [];
            let cur: HTMLElement | null = node;
            while (bg === 'rgba(0, 0, 0, 0)' && cur?.parentElement) {
              const s = window.getComputedStyle(cur.parentElement);
              lineage.push(`${cur.parentElement.tagName.toLowerCase()}.${cur.parentElement.className}`.trim());
              bg = s.backgroundColor;
              cur = cur.parentElement;
            }
            const varsWanted = [
              '--color-body',
              '--color-foreground',
              '--color-foreground-strong',
              '--color-neutral',
              '--tw-prose-body',
              '--tw-prose-invert-body',
              '--tw-text-opacity'
            ];
            const varMap: Record<string, string | null> = {};
            for (const v of varsWanted) varMap[v] = style.getPropertyValue(v) || null;
            return {
              fg: style.color,
              bg,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              family: style.fontFamily,
              lineage: lineage.slice(0, 6),
              className: (node as HTMLElement).className,
              vars: varMap,
              inline: (node as HTMLElement).getAttribute('style') || ''
            };
          });

          // Parse rgb/rgba only (browser already resolves OKLCH etc. to rgb)
          const toRGB = (raw: string): [number, number, number] => {
            const match = raw.match(/rgb[a]?\((\d+),\s*(\d+),\s*(\d+)/i);
            if (!match) return [0, 0, 0];
            return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
          };
          const fg = toRGB(m.fg);
          const bg = toRGB(m.bg);
          const ratio = contrast(fg, bg);

            // large text rule
          const large = await handle.evaluate((n: any) => {
            const cs = window.getComputedStyle(n);
            const size = parseFloat(cs.fontSize);
            const weight = parseInt(cs.fontWeight, 10) || 400;
            return size >= 24 || (size >= 18.66 && weight >= 700);
          });
          const min = large ? 3.0 : 4.5;

          const varDebug = Object.entries(m.vars)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}=${v?.trim()}`)
            .join(' ');
          const debug = ` fg=${m.fg} bg=${m.bg} size=${m.fontSize} weight=${m.fontWeight} family="${m.family.split(',')[0]}" classes="${m.className}" vars=[${varDebug}] inlineStyle="${m.inline}" lineage=${m.lineage.join('>')}`;

          // Borderline sentinel (within configurable band of threshold) — does NOT fail test
          if (ratio >= min && ratio < min + sentinelBand) {
            borderline.push({ sel, ratio, min, text: m.fg, classes: m.className, route, large });
          }

          expect(ratio, `Contrast ${ratio.toFixed(2)} < ${min} for selector ${sel} on ${route}.${debug}`)
            .toBeGreaterThanOrEqual(min);
          sampled++;
        }
      }

      // Emit a concise summary for observability; avoids polluting expect output
      if (borderline.length) {
        console.log(`[contrast][borderline] route=${route} count=${borderline.length} sampled=${sampled}`);
        for (const b of borderline) {
          console.log(`  near-threshold sel=${b.sel} ratio=${b.ratio.toFixed(2)} min=${b.min} large=${b.large} classes="${b.classes}"`);
        }
      } else {
        console.log(`[contrast] route=${route} all-passing-with-buffer sampled=${sampled}`);
      }

      // Optional JSON artifact hook (disabled by default)
      if (process.env.CONTRAST_JSON) {
        const payload = { route, sampled, borderline: borderline.map(b => ({ sel: b.sel, ratio: +b.ratio.toFixed(2), min: b.min, large: b.large })) };
        // Write to console in JSON form for CI collection (avoid fs for sandbox simplicity)
        console.log(`__CONTRAST_PAYLOAD__${JSON.stringify(payload)}`);
      }
    });
  }
});
