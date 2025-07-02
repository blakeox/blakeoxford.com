# Testing Strategy

This document outlines the testing approach for the Blake Oxford portfolio site.

## Test Coverage Strategy

### Unit Testing (Vitest)

- **Target**: Pure business logic, utility functions, and isolated component behavior
- **Coverage**: Aiming for 80%+ on included files
- **Scope**:
  - `analytics.js` - Analytics tracking logic
  - `a11y.js` - Accessibility utilities
  - `scroll.js` - Scroll behavior utilities
  - `ThemeToggle.jsx` - Theme switching component
  - API endpoints - Data handling logic
  - Configuration files - Static exports and validation

### End-to-End Testing (Playwright)

- **Target**: User interactions, DOM manipulation, and integration scenarios
- **Coverage**: Full user journeys across browsers (Chromium, Firefox, Webkit)
- **Scope**:
  - Navigation and dropdown interactions
  - Search functionality
  - Mobile responsiveness
  - Accessibility (keyboard navigation, screen readers)
  - Performance monitoring

## Files Excluded from Vitest Coverage

### `dropdown.js`

**Rationale**: This file is heavily DOM-dependent and focuses on interactive UI behavior (menu toggles, keyboard navigation, focus management). It's more effectively tested through Playwright E2E tests that can simulate real user interactions across different browsers and devices.

**E2E Coverage**:

- Mouse interactions (hover, click)
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Mobile touch interactions
- ARIA attributes and screen reader compatibility
- Focus management and trapping

### Astro Components

**Rationale**: Astro components are primarily markup templates that are better tested through E2E tests for actual rendering and user interaction.

## Running Tests

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# All tests
npm test
```

## Coverage Thresholds

- **Statements**: 80%
- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 80%

These thresholds apply only to files included in coverage (utility JS, APIs, configs, React components).
