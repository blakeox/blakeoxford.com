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
- @journey – Primary user flows
- @accessibility-core / @accessibility-extended
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

---
This README will evolve with each phase. See project roadmap for full plan.
