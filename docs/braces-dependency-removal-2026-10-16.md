# Remove the braces dependency path

Checked October 16, 2026. The [upstream advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) still lists no fixed braces release. The registry publishes braces 3.0.3 and micromatch 4.0.8. Updating Stylelint alone retains the affected path.

## Change and control impact

Remove the opt-in astro-compress integration and the editor-only Stylelint package/configuration stack. Both bring micromatch and braces through fast-glob; removing only compression is insufficient. Remove the obsolete braces patch and its package-specific tests when the package itself leaves the graph. Do not rename or vendor the vulnerable package, suppress advisories, or use audit exclusions.

Editor Stylelint diagnostics, ordering rules, and auto-fixes are retired. The existing ESLint, Prettier, design lint, typecheck, build, accessibility, E2E and protected branch controls remain. They are not claimed to implement every former Stylelint rule. VS Code's standard CSS validation remains available. No new linter, compatibility adapter or fork is introduced.

Astro's default HTML compression and Vite/Lightning CSS minification remain. Production Workers Builds does not configure ENABLE_ASTRO_COMPRESS. No Cloudflare runtime setting, binding, account, credentials, models or storage migration changes.

## Validation and rollback

Require frozen install, raw full and production audits with zero findings, full project checks, production build/Worker dry run, preview, current-head PR checks and exact live provenance. Compare generated output to the baseline. Removing package-specific braces tests is justified by removing the package; retain the other override compatibility tests.

Promote through feature -> development -> testing -> main. Stop on failed checks. Blake owns recovery through this chat and sanitized GitHub/Cloudflare logs. Revert the feature merge to restore the former editor tooling if required; restore the captured compatible Worker version if production runtime checks fail. No data rollback is required. A Worker rollback does not undo regenerable index/cache refresh writes.
