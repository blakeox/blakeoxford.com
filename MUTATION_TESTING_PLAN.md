# Mutation Testing Plan (Phase 6)

Goal: Introduce targeted mutation testing to increase confidence that critical logic is meaningfully asserted, without inflating CI time.

## Scope (Initial Wave)

1. Search index generation & query helpers
2. Performance baseline helper (improvement-only update + history logic)
3. API snapshot & schema validation utilities
4. Accessibility contrast heuristic function (if factored out later)

## Tooling Recommendation

Use Stryker for JavaScript/TypeScript with **vitest** test runner integration.
Rationale: Active maintenance, granular mutator controls, dashboard reporting, supports TS via ts-node or build step.

## Metrics & Gating

- Baseline mutation score target: 60% (raise to 75% after stabilization)
- No gating failure on first two PRs introducing config; just report.
- Introduce soft gate (warning) <60%, then hard gate in CI once average over last 5 runs >= baseline target for two consecutive runs.

## Configuration Strategy

- Create `stryker.conf.js` at repo root.
- Mutate only files in `src/utils/`, `src/scripts/search/` (or equivalent), `tests/performance/perfBaselineHelper.ts` (logic copy/facade if needed to avoid test self-mutation confusion).
- Exclude: build scripts, config, content collections, Playwright E2E specs.
- Reporters: progress, clear-text, html (artifact stored in `./mutation-report/` and gitignored).

## Performance Controls

- Concurrency tuned to logical CPUs - 1.
- Disable time-expensive mutators (e.g., Regex, ArrayLiteral) initially.
- Use incremental mode locally (cache) but full clean run in CI nightly.

## CI Integration Phases

1. Phase A: Add config + npm script `test:mutants` (non-blocking).
2. Phase B: Publish HTML report as artifact (CI workflow update).
3. Phase C: Add soft threshold warning (console) < target.
4. Phase D: Enforce threshold (hard fail) once historical stability achieved.

## Developer Workflow

- Run locally: `pnpm test:mutants` for focused confidence when altering core logic.
- Use `--mutate` cli flag to experiment on additional files temporarily.

## Risk Mitigation

- Keep mutation scope narrow to avoid doubling CI duration.
- Review equivalent mutants; adjust ignored mutants list.

## Future Enhancements

- Track mutation score trend in existing quality summary script.
- Correlate mutation score with performance regression detection for holistic quality KPIs.

---

Prepared as part of Test Architecture Phase 6.
