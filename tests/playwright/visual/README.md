# Visual Testing Guide

This folder contains centralized configuration and specs for Playwright visual regression testing.

- Central config: `config.ts`
  - Defines per-route tolerances, screenshot masks, and optional `fullPage` flag (defaults to true)
  - Keeps thresholds conservative by default (1% for content routes)
  - Adds specific allowances where cross-engine variance is known (e.g., `/about/`, `/contact/`)
- Helper: `_visualHelper.ts`
  - Applies the config and normalizes pages (viewport, animations disabled)
  - Waits briefly for layout height to stabilize to avoid full-page height drift
  - Adds route-specific stabilization (e.g., wait for `load` on `/contact/`)
- Nav setup helper: `_navVisualSetup.ts`
  - Shared scroll / auto-hide / mobile-menu setup for component baselines
- Specs:
  - `content-visual.spec.ts` and `app-visual.spec.ts` use `snapshotRoute()` with no inline overrides
  - `../visual-smoke.spec.ts` — route-level smoke snapshots (home, about, projects, contact)
  - `../component-visual-baselines.spec.ts` — nav component baselines (runs in CI via `test:e2e:visual:chromium`)

Best practices:

- Prefer role-based queries for stability in smoke checks
- Keep masks minimal and targeted to animated/decorative regions
- If a route needs tuning, update `config.ts` instead of specs
- Guardrail: max allowed pixel ratio is 3% to prevent overly-permissive diffs
- After intentional nav/CSS changes: `npm run test:e2e:visual:update` and commit `*-chromium.png` snapshots
