# Test Architecture Modernization – Phase 3 Kickoff

Date: 2025-09-11  
Branch Base: `test-architecture-phase2` (to merge into `main` then branch `test-architecture-phase3`)

## 1. Objectives

Elevate regression confidence by introducing stateful baselines & negative-path protections across performance, accessibility, edge logic, and visual correctness while keeping suite fast & deterministic.

## 2. Success Criteria

| Area | Goal | Metric / Exit Condition |
|------|------|--------------------------|
| Performance | Detect regressions vs baseline with opt‑in auto‑improve | Green runs show only net improvements persisted under `UPDATE_PERF_BASELINES` |
| Accessibility | Prevent introduction of new violations | Failing build when new axe violations relative to baseline appear |
| Visual | Deterministic full-page snapshots grouped by type | < 0.006 diff ratio app, < 0.002 content |
| Edge Functions | Cover negative & success paths | send-email + future functions have ≥80% branch cov |
| Reliability | Track run-level flakiness & pass rate | `reliability.svg` + gates integrated |
| Governance | Docs reflect baseline update protocols | CONTRIBUTING updated & enforced |

## 3. Phase 3 Scope

Included:

- Enforce new reliability gate (`FLAKINESS_MIN_PASS_RATE`) in CI (opt-in threshold trial at 0.995 then stabilize ≥0.99).
- Add edge function additional negative cases (timeout / malformed payload) if applicable.
- Expand search fuzz (edge unicode + long query boundary) with iteration cap ≤ 150.
- Accessibility: Add keyboard traversal coverage to essential flows (already partially present) + ensure color contrast heuristic remains stable.
- Introduce API schema drift preflight diff (simplified JSON patch preview) – preparatory script if low-effort.
- Consolidate legacy docs: move flakiness + reliability guidance into single section referenced by README & CONTRIBUTING.

Deferred (Phase 4+): mutation pilot, performance trend slope detection, automated PR comment bot.

## 4. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Increased false positives in visual diffs | Noise & PR friction | Maintain strict masking + keep grouping modular |
| Overly strict reliability threshold early | Build churn | Start soft log-only mode before failing gate |
| Baseline churn from content additions | Reviewer confusion | Require commit message rationale & diff artifact |

## 5. Tooling / Flags Inventory

| Flag | Purpose |
|------|---------|
| `UPDATE_PERF_BASELINES=1` | Persist improved perf metrics |
| `UPDATE_API_BASELINES=1` | Accept intentional API changes |
| `UPDATE_API_BASELINES_DIFF=1` | (Planned) Force diff artifact regeneration |
| `FLAKINESS_MIN_PASS_RATE` | Reliability gate (0–1 float) |
| `PERF_HISTORY=1` | Persist rolling perf history |
| `FLAKY_HISTORY=1` | Per-test flake tracking |

## 6. Backlog (Initial)

1. Integrate pass rate gate into CI preset (log-only first commit, enforce second).
2. Add Unicode + 128-char query cases to `searchFuzz.test.ts` (keep total test time minimal).
3. Add additional negative-path test for `send-email` edge function (simulate resend API failure variant if not covered).
4. Lightweight API diff preflight script (JSON structural field additions/removals) – fail if unflagged.
5. Expand contrast ratio spec to include dark theme toggle path (if design tokens stable) with small selector sample.
6. Create mask registry utility for future dynamic visual elements (place stub w/ no-op for now).
7. Document reliability enforcement timeline in `PHASE3_PROGRESS.md` (created incrementally).

## 7. Definition of Done (Phase 3)

- All above backlog items addressed or explicitly deferred with rationale.
- No increase in average Vitest runtime > +10% vs Phase 2 baseline.
- No new unmasked visual diff flakes in two consecutive mainline runs.
- Reliability gate active with threshold ≥ 0.99 pass rate.

---
Owner: Blake (review), Automation assistance: AI agent.

