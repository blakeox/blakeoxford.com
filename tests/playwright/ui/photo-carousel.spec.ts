import { test, expect, Page } from '@playwright/test';

// Utilities to read computed transform and animation duration
async function getTransform(page: Page, locatorSelector: string): Promise<string> {
  return await page.evaluate((selector: string) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return '';
    const style = getComputedStyle(el);
    return style.transform || '';
  }, locatorSelector);
}

async function getAnimationDuration(page: Page, locatorSelector: string): Promise<string> {
  return await page.evaluate((selector: string) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return '';
    const style = getComputedStyle(el);
    return style.animationDuration || '';
  }, locatorSelector);
}

function matrixTy(transform: string): number | null {
  // matrix(a, b, c, d, tx, ty) → extract ty
  const m = /matrix\(([^)]+)\)/.exec(transform);
  if (!m) return null;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  if (parts.length === 6 && !Number.isNaN(parts[5])) return parts[5];
  return null;
}

// Mobile: horizontal slow scroll visible; desktop columns hidden
test.describe('@essential @carousel PhotoCarousel responsive behavior', () => {
  test('mobile (<md): horizontal slow strip animates', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 }); // mobile width (<md: <768px)
    await page.goto('/about');

    const region = page.getByRole('region', { name: /photo carousel/i });
    await expect(region).toBeVisible();

    // Scope to region to avoid duplicate element issues
    const horizontal = region.locator('ul.animate-carousel-x-slow').first();
    const upCol = region.locator('ul.animate-carousel-up-slow').first();
    const downCol = region.locator('ul.animate-carousel-down-slow').first();

    await expect(horizontal).toBeVisible();
    await expect(upCol).toBeHidden();
    await expect(downCol).toBeHidden();

    // Check animation duration is slow (~70s)
    const animDuration = await getAnimationDuration(page, 'ul.animate-carousel-x-slow');
    expect(animDuration).toContain('70s');

    // Verify motion by comparing transform over time (skip if prefers-reduced-motion)
    const mqlReduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!mqlReduced) {
      const t0 = await getTransform(page, 'ul.animate-carousel-x-slow');
      // Wait until transform changes instead of a raw timeout
      await page.waitForFunction(
        ({ selector, initial }) => {
          const el = document.querySelector(selector) as HTMLElement | null;
          if (!el) return false;
          const style = getComputedStyle(el);
          return style.transform !== initial;
        },
        { selector: 'ul.animate-carousel-x-slow', initial: t0 },
        { timeout: 3000 }
      );
      const t1 = await getTransform(page, 'ul.animate-carousel-x-slow');
      expect(t0).not.toEqual(t1);
    }
  });

  test('desktop (>=md): two vertical slow columns animate', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 }); // desktop (>=md: >=768px)
    await page.goto('/about');

    const region = page.getByRole('region', { name: /photo carousel/i });
    await expect(region).toBeVisible();

    // Scope to region to avoid duplicate element issues
    const horizontal = region.locator('ul.animate-carousel-x-slow').first();
    const upCol = region.locator('ul.animate-carousel-up-slow').first();
    const downCol = region.locator('ul.animate-carousel-down-slow').first();

    await expect(horizontal).toBeHidden();
    await expect(upCol).toBeVisible();
    await expect(downCol).toBeVisible();

    // Check animation durations (~90s)
    const upDur = await getAnimationDuration(page, 'ul.animate-carousel-up-slow');
    const downDur = await getAnimationDuration(page, 'ul.animate-carousel-down-slow');
    expect(upDur).toContain('90s');
    expect(downDur).toContain('90s');

    // Verify both columns animate (transforms change)
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!reduced) {
      const upT0 = await getTransform(page, 'ul.animate-carousel-up-slow');
      const downT0 = await getTransform(page, 'ul.animate-carousel-down-slow');
      // Wait until either column's transform changes instead of a raw timeout
      await page.waitForFunction(
        ({ upSel, dnSel, upInitial, dnInitial }) => {
          const up = document.querySelector(upSel) as HTMLElement | null;
          const dn = document.querySelector(dnSel) as HTMLElement | null;
          if (!up || !dn) return false;
          const upT = getComputedStyle(up).transform;
          const dnT = getComputedStyle(dn).transform;
          return upT !== upInitial || dnT !== dnInitial;
        },
        {
          upSel: 'ul.animate-carousel-up-slow',
          dnSel: 'ul.animate-carousel-down-slow',
          upInitial: upT0,
          dnInitial: downT0,
        },
        { timeout: 4000 }
      );
      const upT1 = await getTransform(page, 'ul.animate-carousel-up-slow');
      const downT1 = await getTransform(page, 'ul.animate-carousel-down-slow');
      expect(upT0).not.toEqual(upT1);
      expect(downT0).not.toEqual(downT1);

      // Optional: confirm they move in different Y directions
      const up0 = matrixTy(upT0);
      const up1 = matrixTy(upT1);
      const dn0 = matrixTy(downT0);
      const dn1 = matrixTy(downT1);
      if (up0 !== null && up1 !== null && dn0 !== null && dn1 !== null) {
        const upDelta = up1 - up0;  // should be negative or positive depending on phase
        const dnDelta = dn1 - dn0;  // opposite sign in steady state
        // Only assert that they are not the same direction (reduce flakiness)
        expect(Math.sign(upDelta)).not.toEqual(Math.sign(dnDelta));
      }
    }
  });

  test('tablet (exactly md breakpoint): desktop columns show at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 }); // exactly at md breakpoint
    await page.goto('/about');

    const region = page.getByRole('region', { name: /photo carousel/i });
    await expect(region).toBeVisible();

    // Scope to region to avoid duplicate element issues
    const horizontal = region.locator('ul.animate-carousel-x-slow').first();
    const upCol = region.locator('ul.animate-carousel-up-slow').first();
    const downCol = region.locator('ul.animate-carousel-down-slow').first();

    // At 768px, should show desktop twin columns
    await expect(horizontal).toBeHidden();
    await expect(upCol).toBeVisible();
    await expect(downCol).toBeVisible();
  });
});
