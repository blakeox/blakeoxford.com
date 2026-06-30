import { test } from '../fixtures';
import { applyThemeOnPage } from '../../utils/colorContrast';
import { assertHeroCtaContrast, runContrastCheck, SAMPLE_CONTRAST_SELECTORS } from '../../utils/contrastCheck';

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

  const themes = (process.env.CONTRAST_THEMES || 'light,dark').split(',').map((t) => t.trim()).filter(Boolean) as Array<'light' | 'dark'>;

  // 2) Sweep pages in each theme
  for (const theme of themes) {
    for (const route of routes) {
      await test.step(`check ${route} (${theme})`, async () => {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        try {
          await page.waitForLoadState('networkidle', { timeout: 4000 });
        } catch {
          await page.waitForTimeout(250);
        }
        await applyThemeOnPage(page, theme);

        if (route.includes('combating-legal-ai-hallucinations')) {
          await page.evaluate(() => {
            document.querySelectorAll('.bg-red-50, .bg-yellow-50, [role="alert"]').forEach((el) => {
              (el as HTMLElement).setAttribute('data-a11y-allow-color-contrast', '');
            });
          });
        }

        if (route === '/') {
          await assertHeroCtaContrast(page, route, theme);
        }

        if (route.includes('/debug/')) {
          return;
        }

        const { sampled, borderline } = await runContrastCheck(page, {
          route,
          theme,
          selectors: SAMPLE_CONTRAST_SELECTORS,
          maxPerSelector: 4,
        });

        if (borderline.length) {
          console.log(`[contrast][borderline] theme=${theme} route=${route} count=${borderline.length} sampled=${sampled}`);
          for (const b of borderline) {
            console.log(`  near-threshold sel=${b.sel} ratio=${b.ratio.toFixed(2)} min=${b.min} large=${b.large} classes="${b.classes}"`);
          }
        } else {
          console.log(`[contrast] theme=${theme} route=${route} all-passing-with-buffer sampled=${sampled}`);
        }
      });
    }
  }
});
