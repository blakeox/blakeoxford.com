# Copilot Playwright Test Instructions

These guidelines apply to all Copilot Chat and code-generation prompts for Playwright test files in this repository. Follow these conventions when generating or modifying Playwright tests:

---

## 1. File Location & Naming

- All Playwright test files must be placed in the `playwright/` or `tests/playwright/` directory.
- Use kebab-case for filenames (e.g., `navigation.spec.ts`, `site-pages.spec.ts`).
- Each test file should have a clear, descriptive name reflecting its purpose (e.g., `projects.spec.ts` for project-related tests).

---

## 2. Test Structure & Style

- Use TypeScript (`.ts`) for all Playwright tests.
- Use `test.describe` blocks to group related tests.
- Use `test()` for individual test cases, with clear, human-readable descriptions.
- Prefer `async/await` for all Playwright actions.
- Use Playwright's built-in accessibility queries (e.g., `getByRole`, `getByLabelText`) for selecting elements whenever possible.
- Always assert expected navigation, visibility, and content using `expect()`.
- For navigation, use `Promise.all([page.waitForURL(), ...])` to avoid race conditions.
- Use comments to clarify non-obvious test logic.

---

## 3. Accessibility & Best Practices

- Prefer role-based selectors for navigation and content checks (e.g., `getByRole('link', { name: 'About' })`).
- Test keyboard accessibility where relevant (e.g., focus, tab order, keyboard shortcuts).
- Validate that all pages/components render with correct headings, navigation, and forms.
- Ensure tests cover error states (e.g., 404 pages, form validation errors).

---

## 4. CI/CD & Maintenance

- Keep tests fast and deterministic; avoid flaky selectors or timing-based waits.
- If skipping a test, use `test.skip()` with a comment explaining why.
- Update or add tests when features/pages change.
- Ensure all Playwright tests pass before merging or deploying.

---

## 5. No Unapproved Dependencies

- Do not add new Playwright plugins or test dependencies unless discussed and approved in a pull request.

---

## 6. Reference

- See the main `copilot-instructions.md` for project-wide conventions.
- Reference the Playwright documentation for advanced usage: https://playwright.dev/docs/test-intro

---
