# Playwright Test Guide (Essentials and Timeline)

This doc covers the essential E2E suite, the new Timeline checks on `/about`, and tips to debug responsive visibility issues.

## Essential suite

- Mark critical tests with `@essential` so they run in the fast CI path.
- CI fast workflow runs:
  - Linux: Chromium-only for speed
  - macOS: Firefox and WebKit for cross-browser confidence

Run locally:

```sh
pnpm test:e2e:essential:chromium              # all default projects
pnpm test:e2e:essential:chromium     # chromium only
PLAYWRIGHT_JOBS=1 pnpm test:e2e:essential:chromium  # serial if debugging
```

## Timeline tests (`@timeline`)

Files:

- `tests/playwright/ui/timeline.spec.ts` — renders and content checks for desktop and mobile.
- `tests/playwright/accessibility/timeline-axe.spec.ts` — scoped Axe rules for `#about-timeline`.
- `tests/playwright/visual/sectional-about-timeline.spec.ts` — stable snapshot of the timeline header; dynamic regions masked.

Selectors and hooks:

- Section root has `id="about-timeline"`.
- Use stable selectors (roles, labels, or section headings) rather than brittle class hooks.
- Mobile scroll container is a focusable region with an accessible name (role="region", aria-label, tabindex).

## Debugging responsive visibility

- The timeline uses viewport media queries with explicit desktop (`.timeline-desktop`) and mobile (`.timeline-mobile`) variants.
- In tests, switch contexts with Playwright projects or `page.setViewportSize()`.
- Assert variant visibility with `toBeVisible()` and ensure the opposite variant is hidden.

Example pattern:

```ts
await expect(page.locator('.timeline-desktop')).toBeVisible();
await expect(page.locator('.timeline-mobile')).toBeHidden();
```

## Visual stability tips

- The About hero carousel is masked via `.photo-carousel` in `tests/playwright/visual/config.ts`.
- Prefer locator-based screenshots for sectional visuals (e.g., heading locators) to avoid clip drift.
- Keep `maxDiffPixelRatio` conservative and update baselines only after human review.

## Accessibility checks

- Use `@axe-core/playwright` for page/section-level checks.
- For mobile scroll regions, ensure they are focusable and named (fixes the `scrollable-region-focusable` rule).

## Cross-browser notes

- CI on Linux runs Chromium only; macOS job runs Firefox/WebKit for `@essential`.
- If a test is flaky cross-browser, prefer role-based selectors, add `locator.first()` where reasonable, and avoid timing assumptions.

## Useful scripts

- Install browsers: `pnpm test:e2e:install`
- Check what browsers are available: `node scripts/build/check-playwright-browsers.cjs`
- Update visual snapshots: `pnpm test:e2e:visual`

