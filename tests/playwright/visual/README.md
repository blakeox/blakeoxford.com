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
- Specs:
  - `content-visual.spec.ts` and `app-visual.spec.ts` use `snapshotRoute()` with no inline overrides
  - `../visual-routes.spec.ts` is a smoke-only spec (no snapshots) to avoid duplicate baselines

Best practices:

- Prefer role-based queries for stability in smoke checks
- Keep masks minimal and targeted to animated/decorative regions
- If a route needs tuning, update `config.ts` instead of specs
- Guardrail: max allowed pixel ratio is 3% to prevent overly-permissive diffs
