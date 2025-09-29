# Test Architecture Modernization – Phase 5 PR

## Summary

Phase 5 extends regression intelligence (history, diff artifacts) and sharpens fidelity between different surface types (content vs app) while adding lightweight accessibility hardening.

## What Changed (Phase 5)

| Area | Change | Files |
|------|--------|-------|
| Performance | Optional historical capture of current baselines (capped) | `tests/performance/perfBaselineHelper.ts`, generates `tests/performance/baselines-history.json` (gitignored) |
| API Contracts | Markdown diff reporting for snapshot updates/mismatches | `tests/contracts/api/api.snapshot.test.ts`, outputs `tests/contracts/baselines/diff-reports/*-diff.md` (gitignored) |
| Visual | Differentiated thresholds (static content stricter) + helper enhancement | `tests/playwright/visual/_visualHelper.ts`, `content-visual.spec.ts`, `app-visual.spec.ts` |
| Accessibility | Contrast ratio heuristic spec (WCAG 2.1 AA quick guard) | `tests/playwright/accessibility/contrast-ratio.spec.ts` |
| Docs | Phase 5 README section + PR template summary | `tests/README.md`, this file |
| Repo Hygiene | Ignore generated history & diff artifacts | `.gitignore` |

## New / Updated Flags

- `UPDATE_API_BASELINES=1` – Refresh API baseline & produce diff report.
- `UPDATE_PERF_BASELINES=1` – Persist strictly improved perf metrics.
- `PERF_HISTORY=1` – Append snapshot of current perf baselines (for future trend analysis).

## Visual Threshold Rationale

- Content pages are near-static; set `maxDiffPixelRatio = 0.002` to detect subtle regressions (layout shifts, unintended styling changes).
- App pages may include more dynamic UI; modest relaxation to `0.006` minimizes false positives while still tight (<0.6%).

## Accessibility Contrast Spec

Purpose: Fast deterministic smoke to catch obvious contrast regressions early without waiting for full axe diff (which may already flag but this narrows failing surface). Caps elements per selector to remain performant.

## API Diff Reports

Markdown includes Added / Removed / Changed sections with JSON before/after blocks. This accelerates code review by surfacing semantic API shifts when baseline updates are intentional.

## Performance History (Future Use)

Collected data enables: slope detection (prevent drift), auto-comment summaries, anomaly alerts (e.g., continuous mild increases below tolerance).

## Risk & Mitigations

| Risk | Mitigation |
|------|------------|
| Over-noise from history file | Gitignored + opt-in flag |
| Diff report omission in PR | Documented workflow: run with `UPDATE_API_BASELINES=1` locally before pushing intended changes |
| Visual flake due to tighter threshold | Group-specific tuning; can mask dynamic selectors if needed |

## Follow-Up (Proposed Phase 6+ Targets)

1. Mutation testing pilot (schemas + search ranking logic).
2. Trend analyzer generating regression warnings when history slope exceeds threshold.
3. Automated PR comment summarizing API diff & perf delta (GitHub Action).
4. Theming/contrast token audit across modes.
5. Component-level (isolated) visual snapshots for critical UI atoms.

## Validation Performed

- API snapshot test passes with no diff when unchanged.
- Visual specs pass under new thresholds.
- Contrast ratio spec executes quickly and enforces WCAG ratios.
- README updated; generated artifacts excluded via `.gitignore`.

## Commit Message Suggestion

```bash
test(phase5): perf history, api diff reports, visual thresholds, contrast spec, docs
```

## Reviewer Checklist

- [ ] No unintended baseline updates.
- [ ] Diff reports only present if baseline intentionally refreshed.
- [ ] Visual snapshots stable in CI (re-run if flakes observed).
- [ ] Contrast spec runtime acceptable (< ~5s per run target).

---
Let me know if any additional automation (CI annotations, PR comment bot) should be added in this phase before merge.
