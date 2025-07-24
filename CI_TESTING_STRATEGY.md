# Testing & CI/CD Strategy

This repository uses an optimized CI/CD strategy designed to provide fast feedback while maintaining comprehensive test coverage.

## Workflow Structure

### 🚀 Fast CI (`ci-fast.yml`)
- **Trigger**: All PRs and pushes
- **Duration**: ~10-15 minutes
- **Purpose**: Quick validation for immediate developer feedback
- **Tests**:
  - Linting & build validation
  - Unit tests
  - Essential E2E tests (navigation, accessibility, performance smoke)
- **Browser**: Chromium only
- **Strategy**: Fail-fast with sequential job dependencies

### 🔍 Comprehensive CI (`ci-comprehensive.yml`) 
- **Trigger**: Main branch pushes, nightly schedule, manual dispatch
- **Duration**: ~30-45 minutes
- **Purpose**: Complete test coverage and quality assurance
- **Tests**:
  - Full test suite with coverage
  - All E2E tests across multiple browsers
  - Performance testing with Lighthouse
  - Bundle analysis
- **Browsers**: Chromium, Firefox, Safari
- **Strategy**: Parallel execution for maximum coverage

### ⚡ Legacy Workflows (Deprecated)
- `tests.yml`, `e2e.yml`, `lighthouse.yml` - Now manual-dispatch only
- Converted to avoid conflicts with new optimized workflows

## Test Organization

### Essential Test Files (Fast CI)
- `accessibility-basic.spec.ts` - Core WCAG compliance
- `navigation-essential.spec.ts` - Critical user navigation paths  
- `performance-smoke.spec.ts` - Basic performance validation

### Comprehensive Test Files (Full CI)
- All tests including heavy accessibility, performance monitoring, chaos engineering
- Currently excludes problematic 500+ line test files pending refactoring

## Performance Optimizations

### Build Artifact Sharing
- Performance workflow builds once, shares across multiple jobs
- Reduces duplicate build time from ~15 minutes to ~3 minutes

### Smart Browser Matrix
- Fast CI: Chromium only (covers 80% of users, fastest execution)
- Comprehensive CI: All browsers (complete coverage)

### Conditional Execution
- Expensive tests only run on main branch
- Development PRs get fast feedback
- Production deployment gets full validation

### Concurrency Controls
- Automatic cancellation of outdated workflow runs
- Prevents resource waste on superseded commits

## Performance Targets

- **Fast CI**: < 15 minutes (achieved)
- **PR Feedback**: < 10 minutes for basic validation (achieved)
- **Build Step**: < 5 minutes (optimized through caching)
- **Test Coverage**: Maintained at 80%+ (comprehensive CI)

## Usage

### For Development
```bash
# Run fast local tests
pnpm test:ci:fast

# Run comprehensive local tests  
pnpm test:ci

# Run specific test categories
pnpm test:e2e:essential
```

### For CI/CD
- PRs automatically trigger Fast CI
- Main branch automatically triggers Comprehensive CI
- Manual comprehensive testing available via workflow_dispatch

## Future Optimizations

1. **Smart Test Selection**: Run tests only for changed files
2. **Test Result Caching**: Skip tests for unchanged code
3. **Performance Budgets**: Automatic failure on regression
4. **Parallel Test Sharding**: Split large test suites across runners

## Monitoring

- Build times tracked in workflow runs
- Test results archived for 7-30 days depending on importance
- Performance reports generated and stored as artifacts
- Coverage reports uploaded and tracked

This strategy ensures both developer productivity and production quality.