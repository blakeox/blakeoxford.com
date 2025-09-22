# Contributing Guide

Thank you for investing time in improving this project. This guide covers workflow, quality gates, deterministic test practices, and design governance.

## Branch & Commit Hygiene

- Branching model (long-lived):
  - `development` → integration from feature/sprint branches
  - `testing` → pre-release verification and cross-browser checks
  - `main` → production
  - Hotfixes: `hotfix/*` → PR to `main`, then back-merge to `development` and `testing`

- Use feature branches; prefix with area if helpful (e.g. `feat/search-index`, `quality/flakiness-metrics`). Create from `development` unless it is a hotfix.
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `refactor:`, `chore:`.
- Keep commits atomic; separate logic, tests, and large refactors where possible.

## Scripts & Tooling

Core commands:

| Intent | Command |
|--------|---------|
| Dev server | `pnpm dev` |
| Build static site | `pnpm build` |
| Unit tests (Vitest) | `pnpm test` |
| E2E tests (Playwright) | `pnpm test:e2e` |
| Comprehensive quality (CI parity) | `pnpm test:ci` |
| Flakiness track | `pnpm flakiness:track` |
| Flakiness gate | `pnpm flakiness:check` |
| Mutation testing (if configured) | `pnpm mutation:test` |
| Generate quality summary | `pnpm quality:summary` |
| Snapshot current quality | `pnpm quality:snapshot` |
| Generate quality badges | `pnpm quality:badges` |
| Design lint | `pnpm design:lint` |

## Deterministic Testing Guidelines

Avoid brittle timeouts. Prefer utility waits:

| Use Case | Utility |
|----------|---------|
| Wait after theme toggle | `waitForThemeReady` |
| Wait after network-triggering action | `waitForNetworkIdleAfterAction` |
| Ensure layout settled before screenshot | `waitForLayoutStability` |
| Scroll-driven lazy load complete | `waitForScrollSettle` |
| Dynamic list population | `waitForDynamicList` |
| Focus transition in accessibility flows | `waitForFocusChange` (if implemented) |

Principles:

- Never `page.waitForTimeout()` for stabilization.
- Keep retries low; fix root cause not symptoms.
- Add assertions during waits to fail fast on terminal states.
- Tag future visual smoke tests with `@visual-smoke` for optional runs.

## Flakiness & Reliability

Environment variables (CI set):

- `FLAKINESS_MAX_CURRENT_FLAKY` – Hard cap on flaky tests.
- `FLAKINESS_MAX_RETRY_INTENSITY` – Average retries/test-run ceiling.
- `FLAKINESS_STRICT` – Fail if history absent.
- `FLAKINESS_MIN_PASS_RATE` – Minimum acceptable latest run pass rate (0-1 float) enabling reliability gating.

Artifacts & Scripts:

- Run-level history: `flakiness-history.json` (mirrored to `.cache/quality/flakiness-history.json` for continuity across clean operations).
- Per-test flake history (opt-in): enable with `FLAKY_HISTORY=1 node scripts/quality/report-flaky-tests.js` → persists to `.cache/quality/flaky-tests-history.json`.
- Flaky test inspection: `node scripts/quality/report-flaky-tests.js` lists retry-assisted passes and current failures.
- Threshold gate: `pnpm flakiness:check` now also supports reliability via `FLAKINESS_MIN_PASS_RATE`.
- Badges: `pnpm quality:badges` generates `badges/reliability.svg` (pass rate) & `badges/flakiness.svg` (retry intensity).

Guidance:

- Keep `retry: 1` (Vitest) — raise only with justification; excessive retries mask instability.
- Treat any non-zero retry-assisted pass as a candidate for root cause investigation before growing test surface.
- When pruning history (automatic for zero-test placeholders), do not manually edit history files—allow scripts to manage integrity.

Quality summary + badges surface trends early; address red metrics before adding new surface area.

## Design Governance

Refer to `DESIGN_BEST_PRACTICES.md` for:

- Token extension process (no ad-hoc hex values in components).
- Spacing scale usage & rationale.
- Typography ramp + responsive strategy.
- Contrast & dark mode expectations (WCAG AA minimums, avoid borderline ratios).
- Motion & reduced-motion behavior.
- Component API design (composition > boolean prop explosion).

Design lint (`pnpm design:lint`) flags raw hex & suspicious spacing to prevent drift.

## Performance & Budgets

- Budgets enforced during build; investigate increases immediately.
- Prefer AVIF/WebP; ensure fallback logic maintains parity.
- Defer non-critical JS; use Astro islands sparingly.

## Accessibility

- All interactive elements keyboard reachable.
- Provide visible focus states (token-driven, high contrast).
- Use semantic landmarks (header, main, nav, footer, aside) for structure.
- Add `aria-live` only when necessary; avoid noisy regions.

## Pull Request Checklist

Before requesting review:

- [ ] Unit & E2E tests added/updated.
- [ ] No raw hex or suspicious spacing (run design lint).
- [ ] Flakiness gating passes locally if modified test flows.
- [ ] No new large dependencies without discussion.
- [ ] README or relevant docs updated if behavior or architecture changed.
- [ ] Source/target branches follow the required flow:
	- feature/* or sprint/* → development
	- development → testing
	- testing → main
	- hotfix/* → main (then back-merge to development/testing)

## Issue Labels (Suggested)

| Label | Purpose |
|-------|---------|
| `type:bug` | Defect or regression |
| `type:feature` | New capability |
| `quality:flaky` | Flaky test tracking |
| `quality:perf` | Performance task |
| `a11y` | Accessibility-related work |
| `docs` | Documentation only |

## Security Considerations

- Treat environment variables as sensitive (no logging secrets).
- Validate user input in edge functions (anti-abuse, rate limit, Turnstile if sensitive).

## Release Cadence

- Tag stable architecture milestones (e.g., `v2-quality-foundation`).
- Use changelog summaries in PR descriptions for multi-commit feature branches.

---

Questions? Open a discussion or draft PR for early feedback.
