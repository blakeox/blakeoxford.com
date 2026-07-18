---
description: Testing standards and practices for Blake Oxford's Portfolio
applyTo: '**/tests/**'
---

# Testing Instructions

Comprehensive testing guidelines covering unit tests (Vitest), e2e tests (Playwright), and quality standards.

---

## 1. Test Organization

### Directory Structure

- `tests/vitest/` - Unit and component tests
- `tests/playwright/` - E2E and accessibility tests
- `tests/__mocks__/` - Mock implementations
- `tests/reporters/` - Custom test reporters
- `tests/utils/` - Test utilities and helpers

### File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts` (in `tests/playwright/`)
- Use kebab-case for descriptive filenames

---

## 2. Unit Testing (Vitest)

### Configuration

- Config: `vitest.config.ts`
- Setup: `vitest.setup.ts`
- Environment: happy-dom for DOM testing
- Coverage: v8 provider with thresholds

### Best Practices

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render with expected content', () => {
    render(<ComponentName title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('should handle user interaction', async () => {
    const handleClick = vi.fn();
    render(<ComponentName onClick={handleClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Flakiness Management

- **Retry policy**: `retry: 1` (single retry enabled)
- **Tracking**: Custom flakiness reporter logs retry-assisted passes
- **Threshold**: Check with `pnpm flakiness:check`
- **Never**: Increase retry count without justification

### Coverage Standards

- Statements: 15% minimum (realistic for Astro SSG)
- Branches: 10% minimum
- Functions: 10% minimum
- Lines: 15% minimum
- Run: `pnpm test:coverage`

---

## 3. E2E Testing (Playwright)

### Configuration

- Config: `playwright.config.ts`
- Test timeout: 30s (configurable per test)
- Browsers: Chromium (default), Firefox, Safari (CI-conditional)
- Retries: 2 on CI, 0 locally

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should complete user flow @essential', async ({ page }) => {
    await page.goto('/');
    
    // Use semantic selectors
    await page.getByRole('link', { name: 'About' }).click();
    
    // Assert navigation
    await expect(page).toHaveURL('/about');
    
    // Verify content
    await expect(page.getByRole('heading', { level: 1 }))
      .toContainText('About');
  });
});
```

### Deterministic Test Patterns

**Avoid**: `page.waitForTimeout()` for stabilization

**Use**: Utility waits from `tests/utils/`:
- `waitForThemeReady` - After theme toggle
- `waitForNetworkIdleAfterAction` - After network requests
- `waitForLayoutStability` - Before screenshots
- `waitForScrollSettle` - For scroll-driven lazy loading
- `waitForDynamicList` - For dynamic content population

### Selector Strategy

1. **Prefer**: Role-based selectors (`getByRole`, `getByLabelText`)
2. **Acceptable**: Test IDs for complex scenarios
3. **Avoid**: CSS selectors tied to implementation

### Essential Tests

Tag critical paths with `@essential` for fast CI runs:
```bash
pnpm test:e2e:essential  # Run only essential tests
```

---

## 4. Accessibility Testing

### Automated Checks

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
    
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Manual Testing Checklist

- Keyboard navigation (Tab, Enter, Esc, Arrows)
- Screen reader announcements
- Color contrast (run `pnpm audit:contrast`)
- Focus management in modals
- Form validation and error states

### Baseline Tracking

- File: `tests/accessibility-baseline.json`
- Track trends: `pnpm a11y:trend`

---

## 5. Quality Gates

### Pre-Commit Checks

```bash
pnpm lint           # ESLint
pnpm typecheck      # TypeScript
pnpm test           # Unit tests
```

### Pre-Deployment

```bash
pnpm deploy:quality-gate  # Comprehensive quality check
```

Includes:
- Lint and type checking
- Full test suite (unit + e2e)
- Performance budgets
- Security audits
- Flakiness thresholds
- Mutation score checks

### CI/CD Workflows

- **Fast CI**: `pnpm ci:fast` - Essential tests only
- **Full CI**: `pnpm ci:full` - Comprehensive validation
- **Act Local**: `pnpm act:e2e` - Test GitHub Actions locally

---

## 6. Flakiness & Reliability

### Environment Variables

- `FLAKINESS_MAX_CURRENT_FLAKY` - Max allowed flaky tests
- `FLAKINESS_MAX_RETRY_INTENSITY` - Average retries ceiling
- `FLAKINESS_MIN_PASS_RATE` - Minimum pass rate (0-1 float)
- `FLAKINESS_STRICT` - Fail if history absent

### Monitoring

- History: `flakiness-history.json` (mirrored to `.cache/quality/`)
- Reports: `pnpm flakiness:track`
- Badges: `pnpm quality:badges` generates reliability metrics

### Investigation Process

1. Run `node scripts/quality/report-flaky-tests.js` to identify flaky tests
2. Review retry patterns and failure modes
3. Fix root cause (timing, race conditions, state pollution)
4. Never mask instability with excessive retries

---

## 7. Performance Testing

### Lighthouse CI

```bash
pnpm perf:test      # Run Lighthouse performance tests
./scripts/build/performance-budget.sh  # Size/bundle budget gate (CI)
pnpm perf:summary   # Generate summary report
```

### Performance Budgets

- First Contentful Paint: < 1.8s
- Speed Index: < 3.4s
- Time to Interactive: < 3.8s
- Total Blocking Time: < 300ms
- Cumulative Layout Shift: < 0.1

### Long Task Analysis

```bash
pnpm perf:long-tasks  # Analyze JavaScript execution
```

---

## 8. Test Maintenance

### When Tests Fail

1. **Never** skip tests without investigation
2. Use `test.skip()` with explanatory comment for known issues
3. Create tracking issue for skipped tests
4. Update tests when features change

### Reducing Flakiness

- Use Playwright's auto-waiting
- Avoid hard-coded timeouts
- Test in isolation (clean state per test)
- Mock external dependencies
- Use utility waits for dynamic content

### Documentation

- Document non-obvious test setup
- Explain complex assertions
- Link to related components/features
- Keep test descriptions human-readable

---

## 9. Reference Commands

```bash
# Unit Testing
pnpm test                 # Run Vitest tests
pnpm test:coverage        # With coverage report

# E2E Testing  
pnpm test:e2e            # Full Playwright suite
pnpm test:e2e:essential  # Essential tests only
pnpm test:e2e:ui         # Interactive UI mode

# Quality Checks
pnpm test:ci             # Both test suites
pnpm test -- --run       # Unit tests
pnpm flakiness:track     # Track flaky tests
pnpm flakiness:check     # Validate thresholds

# Performance
pnpm perf:test           # Lighthouse tests
./scripts/build/performance-budget.sh  # Size/bundle budget gate
```

---

## Reference Documents

- `playwright.config.ts` - Playwright configuration
- `vitest.config.ts` - Vitest configuration
- `CONTRIBUTING.md` - Detailed testing workflows
- `.github/instructions/playwright.instructions.md` - Playwright-specific guidance
