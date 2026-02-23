# Upgrade Vite — Safe upgrade checklist

Purpose
- Document a safe, reproducible workflow to upgrade Vite and validate the site build and tests.

Steps
1. On a local machine with network access, switch to this branch:
   ```bash
   git checkout chore/upgrade-vite
   ```
2. Update Vite (and related plugins) with pnpm:
   ```bash
   pnpm up vite@latest @vitejs/plugin-react@latest --latest -L
   ```
   Adjust plugin versions as needed.
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
6. If CI passes, mark the todo as done and merge. If failures occur, create targeted fixes or revert and split the upgrade.

Notes
- Remove or validate any `pnpm.overrides` entries related to Vite or its plugins before bumping; remove them in small stages and run tests after each change.
- If native build scripts (sharp/esbuild) require approvals, run `pnpm approve-builds` on the CI host as needed.
- Keep changes minimal and test often; prefer multiple small PRs over a single large upgrade.


Note: A helper npm script 'upgrade:vite' has been added to package.json to run the upgrade command: 

  pnpm run upgrade:vite

Run this on a machine with network access to update package.json and pnpm-lock.yaml.
