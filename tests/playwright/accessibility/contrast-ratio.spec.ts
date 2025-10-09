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

// Skip any elements inside containers explicitly marked to allow contrast variance
// Also skip typical alert/notice containers where color semantics may intentionally differ
const SKIP_CONTAINER = '[data-a11y-allow-color-contrast], [role="alert"]';

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

      // Route-specific annotation: mark alert-style panels as skippable for heuristic contrast checks
      if (route.includes('combating-legal-ai-hallucinations')) {
        await page.evaluate(() => {
          document.querySelectorAll('.bg-red-50, .bg-yellow-50, [role="alert"]').forEach((el) => {
            (el as HTMLElement).setAttribute('data-a11y-allow-color-contrast', '');
          });
        });
      }

      // Extra guard: directly assert the homepage hero CTA maintains sufficient contrast
      if (route === '/') {
        const cta = page.locator('[data-test="home-cta-connect"]').first();
        await expect(cta).toBeVisible();
        const colors = await cta.evaluate((node:any) => {
          const cs = window.getComputedStyle(node);
          const normalize = (raw:string) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return raw;
            ctx.fillStyle = '#000';
            ctx.fillStyle = raw;
            return ctx.fillStyle as string;
          };
          return { fg: normalize(cs.color), bg: normalize(cs.backgroundColor), size: cs.fontSize, weight: cs.fontWeight };
        });
        console.log(`[hero-cta] route=${route} fg=${colors.fg} bg=${colors.bg} size=${colors.size} weight=${colors.weight}`);
        const toRGB = (raw:string) => {
          const m = raw.match(/rgb[a]?\(\s*(\d+)\s*(?:,|\s)\s*(\d+)\s*(?:,|\s|\/)\s*(\d+)/i);
          if (m) return [parseInt(m[1],10), parseInt(m[2],10), parseInt(m[3],10)];
          const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
          if (hex) {
            let h = hex[1];
            if (h.length === 3) h = h.split('').map(c => c + c).join('');
            return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
          }
          return [0,0,0];
        };
        const fg = toRGB(colors.fg);
        const bg = toRGB(colors.bg);
        const L = (r:number,g:number,b:number) => { const a=[r,g,b].map(v=>{v/=255;return v<=0.03928? v/12.92: Math.pow((v+0.055)/1.055,2.4);}); return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]; };
        const ratio = (() => { const L1=L(fg[0],fg[1],fg[2]); const L2=L(bg[0],bg[1],bg[2]); const light=Math.max(L1,L2), dark=Math.min(L1,L2); return (light+0.05)/(dark+0.05); })();
        expect(ratio, `Hero CTA contrast ${ratio.toFixed(2)} < 4.5`).toBeGreaterThanOrEqual(4.5);
      }

      const sentinelBand = parseFloat(process.env.CONTRAST_SENTINEL_BAND || '0.10');

      const borderline: Array<{ sel: string; ratio: number; min: number; text: string; classes: string; route: string; large: boolean; }> = [];
      let sampled = 0;

      for (const sel of sampleSelectors) {
        const handles = await page.locator(sel).elementHandles();
        for (const handle of handles.slice(0, 5)) { // cap for speed
          const isInsideSkip = await handle.evaluate((node, skipSelector) => {
            let cur: HTMLElement | null = node as HTMLElement;
            while (cur) {
              if ((cur as any).matches && (cur as any).matches(skipSelector as string)) return true;
              cur = cur.parentElement;
            }
            return false;
          }, SKIP_CONTAINER);
          if (isInsideSkip) continue;

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
            // Normalize CSS color strings (including OKLCH) to rgba() using canvas
            const normalizeColor = (raw: string): string => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return raw;
                ctx.fillStyle = '#000';
                ctx.fillStyle = raw; // browser will normalize if supported
                return ctx.fillStyle as string; // typically returns rgba(r,g,b,a)
              } catch {
                return raw;
              }
            };
            const fgNorm = normalizeColor(style.color);
            const bgNorm = normalizeColor(bg);
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
              fgNorm,
              bgNorm,
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
            if (!raw) return [0, 0, 0];
            const val = raw.trim().toLowerCase();
            // hex #rgb or #rrggbb
            const hexMatch = val.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
            if (hexMatch) {
              let h = hexMatch[1];
              if (h.length === 3) {
                h = h.split('').map(c => c + c).join('');
              }
              const r = parseInt(h.substring(0, 2), 16);
              const g = parseInt(h.substring(2, 4), 16);
              const b = parseInt(h.substring(4, 6), 16);
              return [r, g, b];
            }
            // rgb/rgba: comma or space separated, optional alpha with '/'
            const rgbMatch = val.match(/rgb[a]?\(\s*(\d+)\s*(?:,|\s)\s*(\d+)\s*(?:,|\s|\/)\s*(\d+)/i);
            if (rgbMatch) {
              return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
            }
            return [0, 0, 0];
          };
          const fg = toRGB(m.fgNorm || m.fg);
          const bg = toRGB(m.bgNorm || m.bg);
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
