# Test Suite Architecture (Phase 0 Refresh)

This directory is undergoing a multi‑phase modernization focused on reliability, signal quality, and speed.

## Layers (Target State)

- unit/ – Pure logic & component behavior
- integration/ – Cross-module w/o full browser
- contracts/ – API & content schema validation
- e2e/
  - functional/
  - accessibility/
  - performance/
  - visual/
- utils/ – Shared helpers (pageActions, axe, fixtures)
- mocks/ – Explicit test doubles

Current interim structure will be migrated incrementally.

## Tagging Conventions (Playwright)

- @smoke @essential – Fast core health
- @extended – Heavy/slow suites (chaos, bundle analysis, full visual matrix); opt in via `PLAYWRIGHT_EXTENDED=true` or `pnpm run test:e2e:extended`
- @journey – Primary user flows
- @accessibility-core / @accessibility-contrast / @accessibility-extended
- @perf-budget / @perf-regression
- @visual-essential / @visual-full
- @diagnostic – Debug / verbose

## Phase 0 Changes

- Added helpers: `tests/utils/pageActions.ts`, `tests/utils/axeHelper.ts` (placeholder)
- Marked low-value mock-only tests as skipped (`a11y.test.ts`, `generateSearchIndex.test.ts`)
- Tagged essential specs (`core-accessibility.spec.ts`, `navigation.spec.ts`)
- Broadened coverage include set & set initial thresholds (will ratchet upward)

## Upcoming (Phase 1)

1. Consolidate duplicate navigation/search specs
2. Add real integration test for search index script
3. Introduce axe-core automated accessibility runner
4. Create API contract tests (Zod validation)
5. Deterministic waits replacing timeouts

## Contributing Guidelines (Tests)

- Prefer behavior assertions over implementation details
- Avoid arbitrary `waitForTimeout`; use locator states or events
- Centralize repeated page actions in `tests/utils`
- Tag new specs appropriately; keep @smoke under 30s total

## Ratcheting Coverage Strategy

- Increment thresholds by +5% once stable for two releases

## Phase 1 Additions

Implemented in this phase:

- contracts/api/projects.contract.test.ts & blog.contract.test.ts (Zod validation of public JSON outputs)
- integration/searchIndex.integration.test.ts (executes real generation script)
- playwright/accessibility/axe-core.spec.ts (automated WCAG A/AA scan)
- playwright/functional/navigation-search.journey.spec.ts (merged core nav + search actions)

These lay groundwork for removing older redundant navigation/search specs in a later cleanup PR.

> Note: Deterministic wait utilities originally listed as a Phase 1 goal were intentionally deferred for stability and landed at the start of Phase 2 (`tests/utils/waits.ts`). This avoids retrofitting brittle legacy specs mid‑phase and ensured the helper design reflected early lessons from the merged navigation/search journey.

### Deprecations

Legacy skipped specs (`navigation-essential`, `search-functionality`, `user-journeys`, `pages`, `basic`, `visual`, `visual-routes`) were removed in favor of:

- `functional/navigation-search.journey.spec.ts` — nav + search journeys
- `visual-smoke.spec.ts` + `component-visual-baselines.spec.ts` — visual regression
- `vitest/a11y.test.ts` (mock-only) removed; a11y covered by Playwright axe/contrast specs

### Centralized Schemas

API response schemas now live in `src/config/apiSchemas.ts` and are imported by contract tests. This avoids schema drift between implementation and validation.

## Phase 2 Updates

Added:

- `tests/utils/waits.ts` deterministic wait helpers.
- Central performance budgets `tests/config/performance-budgets.json` consumed by `performance-budget.spec.ts`.
- Consolidated visual smoke `visual-routes.spec.ts` and deprecated legacy visual & journey specs.

Deprecated (skipped):

- `basic.spec.ts`
- `navigation-essential.spec.ts`
- `search-functionality.spec.ts`
- `pages.spec.ts`
- `user-journeys.spec.ts`
- `visual.spec.ts` (full-page legacy)

Refactoring Guidelines:

- Prefer helpers over inline `waitForTimeout`.
- New visual assertions should centralize screenshot logic in a dedicated helper (future phase).

---
This README will evolve with each phase. See project roadmap for full plan.

## Phase 3 Updates

Added systems & improvements:

- Performance regression baseline: `tests/performance/baselines.json` + helper `tests/performance/perfBaselineHelper.ts` with spec `playwright/performance-regression.spec.ts` comparing current metrics to baseline within tolerance.
  - Multi-browser support: helper will look for a browser-specific key first, in the form `"/route"__chromium|firefox|webkit`. If missing, it falls back to the generic route key. When `UPDATE_PERF_BASELINES=1` is set, improvements are persisted to the browser-specific key when present.
  - Conservative ratcheting: to avoid over-tightening from a single lucky run, improvements are only persisted when >2% better than baseline, and any single update caps the drop to 5% for that metric. Requests are normalized to integers.
  - Suspect baseline reseed: if an existing browser-specific baseline is unrealistically low (e.g., <20% of the generic route baseline) and the current run exceeds even a doubled tolerance window, the helper will reseed that browser-specific baseline from the current run when `UPDATE_PERF_BASELINES=1` is set. This corrects accidental too-low baselines that cause persistent false regressions.

### Quick commands: bake perf baselines

Use these package scripts to update baselines safely (only improvements are written):

- `pnpm perf:bake:chromium`  bake only Chromium baselines
- `pnpm perf:bake:firefox`  bake only Firefox baselines
- `pnpm perf:bake:webkit`  bake only WebKit baselines
- `pnpm perf:bake:all`  bake across all available browsers
- `pnpm perf:bake:history`  also writes `tests/performance/baselines-history.json`

Notes:

- Prerequisite: run `pnpm build` first so `astro preview` can serve `dist/` (Playwright starts `npm run preview` automatically via `playwright.config.ts`).
- These scripts target only `tests/playwright/performance-regression.spec.ts`.
- Browser project names match those in `playwright.config.ts` (`chromium`, `firefox`, `webkit`).
- Accessibility baseline capture: first run of `playwright/accessibility/axe-core.spec.ts` writes `tests/accessibility-baseline.json`, subsequent runs fail on new violations.
- Deterministic visual snapshots: `playwright/visual-routes.spec.ts` now asserts full-page screenshots with animation disabling.
- Coverage thresholds ratcheted (+5% across statements/branches/functions/lines) in `vitest.config.ts`.
- Edge function negative-path & success tests: `tests/vitest/edge/send-email.edge.test.ts` covering validation, rate limit, Turnstile failure, resend failure, and success.
- Run-level flakiness tracking groundwork: `scripts/quality/update-flakiness-history.js` + integration in deployment quality gate (captures aggregate passRate / flakyTests / retryIntensity for future per-test expansion).
- Vitest flakiness reporter: `tests/reporters/flakinessReporter.ts` writing `test-results.json` to supply real counts to history updater.

Removed (deleted) deprecated redundant specs after consolidation:

- navigation-essential.spec.ts
- basic.spec.ts
- search-functionality.spec.ts
- pages.spec.ts
- user-journeys.spec.ts
- visual.spec.ts

Guidelines (updated):

- Add new performance-sensitive routes to baseline JSON; adjust tolerance sparingly (default 7% timings / 10% requests).
- For intentional accessibility rule additions (rare), update baseline after fixing underlying issues, not before.
- Visual snapshots: mask dynamic elements (timestamps, random content) by adding selectors to the `mask` array in `visual-routes.spec.ts`.
- When raising coverage thresholds further, ensure two green runs post-change; track in PR description.

Next Candidates (Phase 4+):

- Mutation testing for critical utility functions.
- Snapshot diff tooling for API response shape changes (schema evolution safety net).
- Extended accessibility: color contrast & keyboard navigation journey.
- Visual diff grouping by route type (content vs application views).

## Phase 4 Updates

Focus this phase: expand regression safety nets (API shape, search robustness, visual stratification) and introduce controlled baseline evolution for performance.

Added:

- API snapshot baseline system:
  - Test: `tests/contracts/api/api.snapshot.test.ts`
  - Baselines: `tests/contracts/baselines/{blog,projects}.baseline.json` (auto‑populated on first run or when `UPDATE_API_BASELINES=1`).
  - Behavior: On empty/missing baseline writes canonical normalized entries; otherwise enforces strict shallow equality & entry count.
  - Use `UPDATE_API_BASELINES=1` only after intentional, reviewed content changes.
- Visual grouping & helper refactor:
  - Replaced single `visual-routes.spec.ts` with grouped specs: `playwright/visual/content-visual.spec.ts` & `playwright/visual/app-visual.spec.ts`.
  - Shared logic centralized in `playwright/visual/_visualHelper.ts` (viewport, animation disabling, route snapshot naming, masking support).
  - Tags now distinguish content vs application visuals: `@visual-content`, `@visual-app` (still part of `@visual-essential`).
- Performance baseline improvement auto‑update (opt‑in):
  - Helper `tests/performance/perfBaselineHelper.ts` marks improved metrics and (if `UPDATE_PERF_BASELINES=1`) persists lower numbers in `tests/performance/baselines.json` via `maybePersistUpdatedBaselines()` in an `afterAll` hook (`performance-regression.spec.ts`).
  - Only improvements (lower timings / fewer requests) are written; regressions still fail within tolerance window (7% timings / 10% requests by default).
- Search fuzz / property‑style tests:
  - `tests/vitest/search/searchFuzz.test.ts` randomly samples substrings from titles/descriptions across combined blog & projects corpus to ensure search handling never throws and returns plausible result sets.
  - Gibberish queries asserted to return empty / near‑empty results (low accidental collision tolerance).
- Accessibility depth acknowledgement:
  - Keyboard / focus journey lives in `playwright/accessibility/keyboard-navigation.spec.ts` (tagged as extended) complementing axe‑core baseline file.

Guidelines (new / updated):

- Baseline Flags:
  - `UPDATE_API_BASELINES=1` – Accept intentional API content shape/value changes (after schema & consumer review).
  - `UPDATE_PERF_BASELINES=1` – Persist only improved performance metrics after a green run (never use to hide regressions).
- Commit Discipline:
  - Baseline changes must be isolated in PR commits with rationale (e.g., “content added: new blog post – updating API snapshot baselines”).
  - Performance baseline improvements should include brief note of previous vs new metric deltas in PR description.
- Visual Snapshots:
  - Add future dynamic masking inside `_visualHelper` via an optional mask registry if more dynamic elements appear.
  - Prefer adding new route groups (e.g., onboarding, dashboards) rather than expanding existing broad groups excessively.
- Search Fuzz:
  - Keep iteration count modest (<= 200) to stay fast; raise only if logic complexity increases.
  - Extend with boundary cases (very long queries, mixed unicode) in a later phase if search surface grows.

Deprecated (removed this phase):

- `playwright/visual-routes.spec.ts` (superseded by grouped specs & helper).

Next Candidates (Phase 5+):

- Mutation testing (e.g., Stryker) focused on critical validators & search indexing logic.
- Contrast ratio & color token validation (automated contrast assertions beyond axe where needed).
- Contract drift diff reporter (human‑readable delta report when API baseline changes under flag, to embed in PR comment).
- Structured visual diff thresholds per route classification (stricter for content pages, slightly relaxed for interactive app pages).
- Performance anomaly trend tracking (persist last N runs for simple regression slope detection).

## Phase 5 Updates

Focus: deeper regression intelligence & stricter differentiation plus incremental accessibility hardening.

Added:

- Performance history tracking (opt‑in):
  - Extends `perfBaselineHelper.ts` writing `tests/performance/baselines-history.json` when `PERF_HISTORY=1`.
  - Captures snapshot of current baseline metrics after each run (capped to last 200 entries) enabling future trend / slope analysis.
- API snapshot diff reporter:
  - `api.snapshot.test.ts` now emits human‑readable markdown diff reports at `tests/contracts/baselines/diff-reports/{blog|projects}-diff.md` when baseline updates are requested (`UPDATE_API_BASELINES=1`) or mismatches occur.
  - Report sections: Added / Removed / Changed with before/after JSON blocks.
- Visual diff thresholds by route type:
  - Content pages use stricter `maxDiffPixelRatio: 0.002`.
  - App/interactive pages slightly relaxed to `0.006` (still low) acknowledging minor dynamic variances.
- Contrast ratio heuristic spec:
  - `playwright/accessibility/contrast-ratio.spec.ts` samples key selectors on core routes enforcing WCAG ≥4.5 (normal) / ≥3.0 (large text) as complement to axe baseline (fast smoke for obvious regressions).

New Flags:

- `PERF_HISTORY=1` – Persist rolling performance baseline snapshots.

Guidelines:

- Include diff report artifacts in PRs when updating API baselines; reviewers can quickly audit semantic changes.
- Keep history file out of noise: do not enable `PERF_HISTORY` in standard CI unless adding trend tooling; prefer scheduled job.
- Adjust visual thresholds conservatively; raising should require justification (e.g., unavoidable dynamic animation artifact after feature addition).
- Contrast spec purposely caps elements per selector (first 5) to remain fast; expand only if coverage gaps identified.

Next Candidates (Phase 6+):

- Introduce mutation testing pilot (target schemas & search ranking function) pending dependency approval.
- Automated PR comment bot summarizing API diff & performance deltas.
- Performance trend regression detector (identify upward drift across last N history points before tolerance exceeded).
- Theming/contrast token audit ensuring all design tokens meet WCAG in both light/dark contexts.
- Visual component-level snapshotting (mount + per-component diff) to catch isolated regressions earlier.

## Phase 6 Updates

Focus: test hygiene, CI action maintenance, and production logging cleanup.

Changes:

- Removed dead legacy Vitest files under `tests/api/` (old Astro JSON route handlers no longer exist; API shape is covered by `tests/contracts/api/*`).
- Deleted obsolete Playwright specs: `accessibility-enhanced`, `visual-regression`, `visual-sectional`, `projects`.
- Heavy / diagnostic suites now opt in via `@extended` or `@debug` tags (`PLAYWRIGHT_EXTENDED=true` or `pnpm run test:e2e:extended`).
- Default visual CI paths: `visual-smoke.spec.ts` + `component-visual-baselines.spec.ts`.
- Grouped visual specs under `playwright/visual/` are `@extended` (not part of fast CI).
- Bumped `pnpm/action-setup` to v6 and completed `actions/checkout@v6` across workflows.
- Removed legacy `@debug` diagnostic Playwright specs (search overlay debug trio, form/keyboard debug, axe-debug-projects) and `tests/assets/search-debug-manual.js`; search, form, and a11y behavior covered by journey and accessibility specs.

## Reliability & Flakiness (Addendum)

Run-level reliability now surfaced via:

- `flakiness-history.json` (and cached mirror `.cache/quality/flakiness-history.json`) capturing `{ totalTests, failedTests, flakyTests, retryIntensity, passRate }` per run.
- `scripts/quality/report-flaky-tests.js` (optional per-test focus) enumerates retry-assisted passes and fails; enable persistence with `FLAKY_HISTORY=1` to build `.cache/quality/flaky-tests-history.json`.
- Gate script `scripts/quality/check-flakiness-threshold.js` supports `FLAKINESS_MIN_PASS_RATE` (0-1), in addition to `FLAKINESS_MAX_CURRENT_FLAKY` and `FLAKINESS_MAX_RETRY_INTENSITY`.
- Badges: `reliability.svg` (pass rate) & `flakiness.svg` (retry intensity) generated via `pnpm quality:badges`.

Heuristics:

- Treat any non-zero retry on a passing test as an instability signal—investigate root causes early.
- Avoid raising global retries above 1; prefer deterministic utilities (`tests/utils/waits.ts`) to reduce variance.
- History automatically prunes zero-test placeholder runs to keep signal clean.

## Navigation Test Matrix (NavBar / Command Center)

Fast essential nav checks (Chromium):

```bash
npx playwright test tests/playwright/menu-visibility-strict.spec.ts \
  tests/playwright/mobile-navigation-essential.spec.ts \
  tests/playwright/layout-scroll-lock.spec.ts \
  tests/playwright/nav-scroll-hide.spec.ts --project=chromium
```

Extended device matrix (opt-in):

```bash
pnpm run test:e2e:device-matrix
```

Visual nav baselines (`navbar`, mobile open/closed, scrolled, auto-hidden) — **gated in CI** (`ci-fast.yml`):

```bash
npm run test:e2e:visual:chromium
npm run test:e2e:visual:update   # regenerate snapshots after intentional UI changes
```

Chromium snapshots live in `component-visual-baselines.spec.ts-snapshots/` and `visual-smoke.spec.ts-snapshots/` (committed to git).

Unit hooks: `tests/vitest/useMobileMenu.test.tsx`, `useNavScrollBehavior.test.tsx`, `useOverlayScrollLock.test.tsx`, `navLinksSync.test.ts`.

Config source of truth: `src/content/navigation/nav.json` (imported by `src/config/navLinks.ts`).

