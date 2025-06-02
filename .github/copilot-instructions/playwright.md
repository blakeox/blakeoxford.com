# Custom Copilot Instructions for Playwright Tests

These instructions apply to all Copilot Chat and code-generation prompts within the `playwright/` and `tests/playwright/` directories. They ensure consistency, reliability, and maintainability for all end-to-end (E2E) and integration tests using Playwright in this project.

---

## 1. File Structure & Naming

- All Playwright test files must be placed in the `playwright/` or `tests/playwright/` directories.
- Use kebab-case for test filenames (e.g., `navigation.spec.ts`, `site-pages.spec.ts`).
- Group related tests by feature or page when possible.

---

## 2. Test Patterns & Best Practices

- Use TypeScript (`.ts`) for all Playwright test files.
- Prefer `test.describe()` blocks to group related tests.
- Use `test.use()` for per-suite or per-test configuration (e.g., base URL, viewport).
- Always use `await` with Playwright actions and assertions.
- Prefer `test.step()` for multi-part actions or complex flows.
- Use `expect()` from Playwright for all assertions.
- Keep tests atomic: each test should verify a single user journey or feature.
- Use `test.skip()` or `test.only()` only for local debugging; never commit these to main.

---

## 3. Accessibility & Performance

- Where possible, include accessibility checks (e.g., check for skip links, focus management, ARIA attributes).
- Use Lighthouse or Playwright's built-in performance assertions for key flows.
- Ensure all navigation and interactive elements are keyboard accessible in tests.

---

## 4. Integration with Project

- Use the base URL and routes defined in the main app (see `astro.config.mjs` and `lighthouserc.json`).
- Test all major pages: `/`, `/about/`, `/blog`, `/projects`, and any dynamic routes.
- Ensure tests pass in CI and locally (see `package.json` scripts: `test:e2e`, `test:e2e:ui`, `test:ci`).
- Do not add new dependencies to Playwright tests unless discussed and approved.

---

## 5. Reporting & Artifacts

- Use Playwright's built-in HTML reporter for local and CI runs.
- Store Playwright reports in the `playwright-report/` directory.
- Keep test output and artifacts out of version control (see `.gitignore`).

---

## 6. Maintenance

- Keep tests up to date with UI and route changes.
- Remove or update tests that are flaky or no longer relevant.
- Review and refactor test code for clarity and maintainability.

---

For more details, see the main `copilot-instructions.md` and `STYLEGUIDE.md`.
