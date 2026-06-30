# Accessibility Test Suite

This directory contains modular accessibility tests broken down by functionality:

## Test Files

- **`core-accessibility.spec.ts`** - Essential accessibility tests that must always pass
- **`wcag-compliance.spec.ts`** - WCAG 2.1 compliance testing
- **`keyboard-navigation.spec.ts`** - Keyboard navigation and focus management
- **`screen-reader.spec.ts`** - Screen reader support and ARIA testing  
- **`form-accessibility.spec.ts`** - Form accessibility and validation

## Why Split Tests?

The original `enhanced-accessibility.spec.ts` was 611 lines long, making it:

- Hard to debug specific failures
- Slow to run all tests when only testing one area
- Difficult to maintain and review
- Prone to timeout issues

## Running Tests

Run all accessibility tests:

```bash
pnpm test:e2e tests/playwright/accessibility/
```

Run specific test suite:

```bash
pnpm test:e2e tests/playwright/accessibility/keyboard-navigation.spec.ts
```

Run contrast checks (light **and** dark themes):

```bash
pnpm exec playwright test tests/playwright/accessibility/contrast-ratio.spec.ts --project=chromium
```

Contrast utilities live in `tests/utils/colorContrast.ts` and `tests/utils/colorResolver.browser.js` (OKLCH/OKLAB-aware).

Run core tests only (fastest):

```bash
pnpm test:e2e tests/playwright/accessibility/core-accessibility.spec.ts
```
