# Dependabot security updater repair

Checked against GitHub's current advisories and npm registry metadata on October 15, 2026.

## Failure and change

Security updater runs [38842109375](https://github.com/blakeox/blakeoxford.com/actions/runs/38842109375)
and [38842110333](https://github.com/blakeox/blakeoxford.com/actions/runs/38842110333)
could not resolve eleven alerts across eight transitive packages. Existing exact
overrides held three packages below patched releases. Other affected paths also
required workspace overrides; direct package updates did not replace them.

| Package | Prior version | Repaired resolution | Reason |
| --- | --- | --- | --- |
| brace-expansion | 5.0.11 | 5.0.12 | Patched expansion complexity |
| fast-uri | 3.1.6 | 3.1.8 | Patched authority parsing |
| ip-address | 10.3.1 | 10.7.4 | Patched address classification and subnet checks |
| compression | 1.8.1 | 1.8.2 | Patched premature-close memory leak |
| proxy-addr | 2.0.7 | 2.0.8 | Patched mapped-address trust check |
| smol-toml | 1.8.0 | 1.9.1 | Patched quadratic parsing |
| postcss-selector-parser | 6.0.10 | 7.1.6 | Patched selector parsing; override scoped to typography |
| sprintf-js | 1.0.3 | Removed | No patched release; js-yaml 3 uses argparse 2's legacy API instead |

The lockfile remains immutable during CI installs. Compatible version ranges in
the affected overrides allow future fixes within the selected major release.
Parent-specific overrides follow [pnpm 10's supported syntax](https://pnpm.io/10.x/settings#overrides).
No direct dependency, package manager, Wrangler, or compatibility date changes.

The unpatched sprintf-js finding is [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).
The replacement argparse version is already in this project's dependency graph;
its Python-2.0 license remains included in the installed package.

## Validation and release control

Regression tests exercise Lighthouse CI's actual YAML configuration loader and
js-yaml 3's legacy CLI flags. Build and browser checks cover the typography parser.
Validate the production and full development graphs separately: a passing
production audit does not mean the development dependency graph is clear.

After protected promotion, verify the deployed full commit and edge/SEO/Ask
behavior. Blake owns recovery. Cancel the active build to stop promotion; restore
the immediately prior compatible Worker version if live acceptance fails. Record
the version before release. This change has no database or storage migration;
Worker rollback does not undo the existing search-refresh command's index writes.
GitHub and Workers Builds retain check/build logs; report failures in the release
chat without secrets.

## Known limits

The full npm audit also reports four findings in development tooling: two in qs,
one in basic-ftp, and one in braces. GitHub currently marks the corresponding
alerts auto-dismissed. Those findings remain unresolved and are outside these two
updater failures. No alerts are dismissed or ignored by this repair.
Hosted updater success and alert closure must be verified after the repaired
lockfile reaches the default branch; a local graph check alone cannot prove them.
