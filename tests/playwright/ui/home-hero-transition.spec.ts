import { test, expect } from '../fixtures';

test.describe('home hero identity', () => {
  test('shows one sentence and two actions in the first viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('#about-me');
    // Identity and actions must be readable immediately, including with motion allowed.
    const fadingContent = await page
      .locator('.home-dual-copy')
      .evaluate((node) =>
        node
          .getAnimations({ subtree: true })
          .some((animation) =>
            (animation.effect as KeyframeEffect)
              .getKeyframes()
              .some((frame) => frame.opacity !== undefined && Number(frame.opacity) < 1)
          )
      );
    expect(fadingContent).toBe(false);
    await expect(hero.getByRole('heading', { name: 'Blake Oxford' })).toBeVisible();
    await expect(
      hero.getByText('Helping companies move AI from pilots into the systems people already run.')
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Discuss your bottleneck' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'See the work' }).first()).toBeVisible();
    await expect(hero.locator('[data-dual-select]')).toHaveCount(0);

    const fitsViewport = await hero.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 1;
    });
    expect(fitsViewport).toBe(true);
  });

  test('keeps a face-led portrait band on phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const layout = await page.locator('#about-me').evaluate((hero) => {
      const visual = hero.querySelector('.home-dual-visual');
      const face = hero.querySelector('.home-dual-face-work');
      if (!visual || !face) return null;
      const vr = visual.getBoundingClientRect();
      const hr = hero.getBoundingClientRect();
      return {
        visualH: Math.round(vr.height),
        heroH: Math.round(hr.height),
        vh: window.innerHeight,
        objectPosition: getComputedStyle(face).objectPosition,
        fits: hr.bottom <= window.innerHeight + 1,
      };
    });

    expect(layout).not.toBeNull();
    expect(layout!.fits).toBe(true);
    expect(layout!.visualH).toBeLessThanOrEqual(Math.round(layout!.vh * 0.42));
    expect(layout!.objectPosition).toContain('18%');
  });

  test('splits identity at the desktop masthead breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const layout = await page.locator('.home-dual-stage').evaluate((node) => {
      const stage = getComputedStyle(node);
      const visual = node.querySelector('.home-dual-visual')?.getBoundingClientRect();
      const copyShell = node.querySelector('.home-dual-copy-shell')?.getBoundingClientRect();
      return {
        display: stage.display,
        sideBySide: Boolean(
          visual && copyShell && visual.left >= copyShell.right - 1 && Math.abs(visual.top - copyShell.top) < 2
        ),
        heroBottom: Math.round(node.getBoundingClientRect().bottom),
        vh: window.innerHeight,
      };
    });

    expect(layout.display).toBe('grid');
    expect(layout.sideBySide).toBe(true);
    expect(layout.heroBottom).toBeLessThanOrEqual(layout.vh + 1);
  });

  test('keeps a single proof strip before writing and convert', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const outcomes = page.locator('#outcomes');
    await expect(outcomes.getByRole('heading', { name: 'Proof from production delivery' })).toBeVisible();
    await expect(outcomes.getByRole('link')).toHaveCount(3);
    await expect(outcomes.getByRole('link', { name: /Cutover with recovery built in/i })).toBeVisible();
    await expect(outcomes.getByRole('link', { name: /Shared ops data teams can run/i })).toBeVisible();
    await expect(outcomes.getByRole('link', { name: /Lending calls on clear inputs/i })).toBeVisible();
    await expect(page.locator('#recent-projects')).toHaveCount(0);

    await expect(page.getByRole('heading', { name: 'Notes from the field' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'All writing', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ethics in the AI Age/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Legal AI Hallucinations/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Local LLM Stack/i })).toHaveCount(0);
    await expect(page.locator('#home-cta-title')).toHaveText('Find your next practical step with AI.');
  });
});
