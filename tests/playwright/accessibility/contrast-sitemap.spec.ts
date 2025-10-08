import { test, expect } from '@playwright/test';

// Sitemap-driven contrast sweep (lightweight, single-test run)
// Tags: @accessibility-extended @sitemap-sweep

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

const SKIP_CONTAINER = '[data-a11y-allow-color-contrast], [role="alert"]';

// Very small XML parser for <loc> entries (no external deps)
function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    locs.push(m[1]);
  }
  return locs;
}

function toRoute(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    // Strip trailing index.html if present and normalize to trailing slash for directories
    let p = u.pathname.replace(/index\.html$/i, '');
    if (!p.startsWith('/')) return null;
    // Filter out non-html resources
    if (p.match(/\.(xml|json|txt|svg|ico|png|jpg|jpeg|avif|webp|js|css)$/i)) return null;
    // Ensure trailing slash for directory-like routes
    if (!p.includes('.') && !p.endsWith('/')) p += '/';
    return p || '/';
  } catch {
    return null;
  }
}

test('@sitemap-sweep contrast ratios acceptable across sitemap pages', async ({ page, request, baseURL }) => {
  // 1) Discover routes from sitemap(s)
  const candidates = ['/sitemap-index.xml', '/sitemap.xml'];
  let locs: string[] = [];
  for (const c of candidates) {
    const res = await request.get(c);
    if (res.ok()) {
      const xml = await res.text();
      const found = extractLocs(xml);
      // If this is a sitemap index, fetch a few child sitemaps to expand coverage
      if (c.includes('sitemap-index')) {
        const childSitemaps = found.slice(0, 3); // cap for speed
        for (const child of childSitemaps) {
          try {
            const r = await request.get(new URL(child, baseURL).toString());
            if (r.ok()) {
              locs.push(...extractLocs(await r.text()));
            }
          } catch {
            // ignore
          }
        }
      } else {
        locs.push(...found);
      }
      break;
    }
  }

  // Fallback to a minimal set if no sitemap was found
  if (!locs.length) {
    locs = [
      new URL('/', baseURL).toString(),
      new URL('/about/', baseURL).toString(),
      new URL('/projects/', baseURL).toString(),
      new URL('/blog/', baseURL).toString(),
    ];
  }

  // Normalize to site-local routes and de-duplicate
  const preferred: string[] = ['/', '/about/', '/projects/', '/blog/'];
  const allRoutes = Array.from(new Set(
    locs
      .map(toRoute)
      .filter((r): r is string => !!r)
  ));

  // Always include preferred in order, then fill with remaining new ones
  const selected: string[] = [];
  for (const p of preferred) if (!selected.includes(p)) selected.push(p);
  for (const r of allRoutes) if (!selected.includes(r)) selected.push(r);

  // Cap total page count for speed; allow env override
  const maxPages = parseInt(process.env.SITEMAP_MAX_PAGES || '16', 10);
  const routes = selected.slice(0, Math.max(1, maxPages));

  console.log(`[sitemap] routes=${routes.length} sample=${routes.join(',')}`);

  const sentinelBand = parseFloat(process.env.CONTRAST_SENTINEL_BAND || '0.10');

  // 2) Sweep pages and apply the same heuristic contrast checks
  for (const route of routes) {
    await test.step(`check ${route}`, async () => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Best-effort settle: networkidle with short timeout, then fallback to a tiny delay
      try {
        await page.waitForLoadState('networkidle', { timeout: 4000 });
      } catch {
        await page.waitForTimeout(250);
      }

      // Route-specific annotation example (carryover from dedicated spec)
      if (route.includes('combating-legal-ai-hallucinations')) {
        await page.evaluate(() => {
          document.querySelectorAll('.bg-red-50, .bg-yellow-50, [role="alert"]').forEach((el) => {
            (el as HTMLElement).setAttribute('data-a11y-allow-color-contrast', '');
          });
        });
      }

      // Guard: homepage hero CTA contrast
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

      const borderline: Array<{ sel: string; ratio: number; min: number; text: string; classes: string; route: string; large: boolean; }> = [];
      let sampled = 0;

      for (const sel of sampleSelectors) {
        const handles = await page.locator(sel).elementHandles();
        for (const handle of handles.slice(0, 4)) { // slightly reduced cap for speed
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
              lineage.push(`${cur.parentElement.tagName.toLowerCase()}.${(cur.parentElement as HTMLElement).className}`.trim());
              bg = s.backgroundColor;
              cur = cur.parentElement;
            }
            const normalizeColor = (raw: string): string => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return raw;
                ctx.fillStyle = '#000';
                ctx.fillStyle = raw;
                return ctx.fillStyle as string;
              } catch {
                return raw;
              }
            };
            const fgNorm = normalizeColor(style.color);
            const bgNorm = normalizeColor(bg);
            return {
              fg: style.color,
              bg,
              fgNorm,
              bgNorm,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              family: style.fontFamily,
              className: (node as HTMLElement).className,
              inline: (node as HTMLElement).getAttribute('style') || ''
            };
          });

          const toRGB = (raw: string): [number, number, number] => {
            if (!raw) return [0, 0, 0];
            const val = raw.trim().toLowerCase();
            const hexMatch = val.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
            if (hexMatch) {
              let h = hexMatch[1];
              if (h.length === 3) h = h.split('').map(c => c + c).join('');
              const r = parseInt(h.substring(0, 2), 16);
              const g = parseInt(h.substring(2, 4), 16);
              const b = parseInt(h.substring(4, 6), 16);
              return [r, g, b];
            }
            const rgbMatch = val.match(/rgb[a]?\(\s*(\d+)\s*(?:,|\s)\s*(\d+)\s*(?:,|\s|\/)\s*(\d+)/i);
            if (rgbMatch) {
              return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
            }
            return [0, 0, 0];
          };
          const fg = toRGB(m.fgNorm || m.fg);
          const bg = toRGB(m.bgNorm || m.bg);
          const ratio = contrast(fg, bg);

          const large = await handle.evaluate((n: any) => {
            const cs = window.getComputedStyle(n);
            const size = parseFloat(cs.fontSize);
            const weight = parseInt(cs.fontWeight, 10) || 400;
            return size >= 24 || (size >= 18.66 && weight >= 700);
          });
          const min = large ? 3.0 : 4.5;

          if (ratio >= min && ratio < min + sentinelBand) {
            borderline.push({ sel, ratio, min, text: m.fg, classes: m.className, route, large });
          }

          expect(ratio, `Contrast ${ratio.toFixed(2)} < ${min} for selector ${sel} on ${route}`)
            .toBeGreaterThanOrEqual(min);
          sampled++;
        }
      }

      if (borderline.length) {
        console.log(`[contrast][borderline] route=${route} count=${borderline.length} sampled=${sampled}`);
        for (const b of borderline) {
          console.log(`  near-threshold sel=${b.sel} ratio=${b.ratio.toFixed(2)} min=${b.min} large=${b.large} classes="${b.classes}"`);
        }
      } else {
        console.log(`[contrast] route=${route} all-passing-with-buffer sampled=${sampled}`);
      }
    });
  }
});
