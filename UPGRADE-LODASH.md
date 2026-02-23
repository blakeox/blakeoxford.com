# Upgrade Lodash — Safe upgrade checklist

Purpose
- Document a safe, reproducible workflow to upgrade Lodash and validate the site build and tests.

Steps
1. On a local machine with network access, switch to this branch:
   ```bash
   git checkout chore/upgrade-lodash
   ```
2. Update Lodash with pnpm:
   ```bash
   pnpm up lodash@latest --latest -L
   ```
3. Install and update lockfile:
   ```bash
   pnpm install --no-frozen-lockfile
   ```
4. Run the build and test suites:
   ```bash
   pnpm build && pnpm test && pnpm test:e2e:essential
   ```
   Fix any compile/test regressions before committing.
5. Commit package.json and pnpm-lock.yaml updates and push a PR for CI validation.

Notes
- Lodash is widely used; upgrade in small stages and prefer patch/minor versions first if possible.
- Run `pnpm audit` and review changes to ensure no breaking changes are introduced.
- If tests fail, consider performing targeted code updates to replace lodash functions or pin to a compatible version.

