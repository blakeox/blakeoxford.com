# Mutation Testing Plan (Phase 6 / Active Implementation)

Goal: Introduce targeted mutation testing to increase confidence that critical logic is meaningfully asserted, without inflating CI time.

## Scope (Initial Wave)

1. Search index generation & query helpers
2. Performance baseline helper (improvement-only update + history logic)
3. API snapshot & schema validation utilities
4. Accessibility contrast heuristic function (if factored out later)

## Tooling Recommendation

Use Stryker for JavaScript/TypeScript with **vitest** test runner integration.
Rationale: Active maintenance, granular mutator controls, dashboard reporting, supports TS via ts-node or build step.

## Metrics & Gating (Current State)

- Active enforced minimum: 60% (hard fail in comprehensive CI).
- Planned raise to 75% after sustained improvement (update `MUTATION_MIN_SCORE`).
- Fast CI remains non-blocking and provides early feedback + badge.
- Ratchet step on `main` auto-updates `.mutation-baseline.json` only when score improves (never decreases), using `MUTATION_RATCHET_ONLY=1 MUTATION_UPDATE_BASELINE=1`.
- Baseline file is committed automatically with `[skip ci]` to avoid loop.

## Configuration Strategy

- Create `stryker.conf.js` at repo root.
- Mutate only files in `src/utils/`, `src/scripts/search/` (or equivalent), `tests/performance/perfBaselineHelper.ts` (logic copy/facade if needed to avoid test self-mutation confusion).
- Exclude: build scripts, config, content collections, Playwright E2E specs.
- Reporters: progress, clear-text, html (artifact stored in `./mutation-report/` and gitignored).

## Performance Controls

- Concurrency tuned to logical CPUs - 1.
- Disable time-expensive mutators (e.g., Regex, ArrayLiteral) initially.
- Use incremental mode locally (cache) but full clean run in CI nightly.

## CI Integration Phases (Executed)

1. Config + script (`test:mutants`) added (non-blocking fast path).
2. HTML report published as artifact in comprehensive workflow.
3. Soft threshold script created (`mutation:check`).
4. Hard gating activated (comprehensive) with baseline ratchet automation on `main`.

## Developer Workflow

- Run locally: `pnpm test:mutants` for focused confidence when altering core logic.
- Use `--mutate` cli flag to experiment on additional files temporarily.

## Risk Mitigation

- Keep mutation scope narrow to avoid doubling CI duration.
- Review equivalent mutants; adjust ignored mutants list.

## Future Enhancements

- Raise threshold to 75% when median over last N (e.g. 5) runs >= 72%.
- Add mutation trend sparkline to quality summary.
- Correlate mutation score with performance regressions for composite risk signal.
- Consider selective mutant retry for flaky equivalent detection.

---

Prepared as part of Test Architecture Phase 6.
