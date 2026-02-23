# Upgrade Vulnerable Dependencies — Checklist

Purpose
- Triage and upgrade dependencies flagged by audits, focusing on high/critical vulnerabilities first.

Workflow
1. Run audit locally:
   ```bash
   pnpm audit --json > audit.json
   node scripts/quality/summarize-audit.js audit.json
   ```
2. For each high/critical finding, attempt targeted upgrades:
   ```bash
   pnpm up <package>@latest --latest -L
   pnpm install --no-frozen-lockfile
   pnpm test
   ```
3. If a vulnerability cannot be fixed by upgrading, consider:
   - Applying a patch (e.g., npm-force-resolutions) and documenting in PR
   - Replacing the dependency with a safer alternative
   - Isolating the usage and adding runtime checks
4. Create PR(s) for each set of upgrades and run CI tests. Prefer small, focused PRs.

Helper script
- A helper script `upgrade:vulnerable` is added to run audit and attempt fixes interactively.

