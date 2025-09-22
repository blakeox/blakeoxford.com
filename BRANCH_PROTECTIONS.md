# Branch Protections

To fully enforce our fast CI gate and branch flow, enable these protections in GitHub settings:

## Required status checks

Enable for `main` and `testing`:

- Required Checks Gate (from workflow: Fast CI)
- Optionally: Quick Validation, Essential E2E Tests, Essential E2E (Firefox/WebKit on macOS)

Set to "Require branches to be up to date before merging" for `main`.

## Pull request reviews

- Require review from Code Owners
- Dismiss stale approvals when new commits are pushed

## Restrict who can push

- Disallow direct pushes to `main`, `testing`, and `development`. Use PRs only.

## Allowed branch flows (enforced by CI)

- feature/* → development
- sprint/* → development
- development → testing
- testing → main
- hotfix/* → main

See `.github/workflows/branch-flow-guard.yml` for details.
