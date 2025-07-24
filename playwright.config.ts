import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  testIgnore: [
    // Temporarily exclude large problematic test files
    '**/accessibility-enhanced.spec.ts', // 545 lines - needs review
    '**/advanced-scenarios.spec.ts', // 539 lines - needs review
    '**/bundle-analysis.spec.ts', // 404 lines - breaking up due to timeouts
    '**/performance-monitoring.spec.ts', // 516 lines - run separately
    '**/chaos-engineering.spec.ts', // 423 lines - run separately
  ],
  timeout: 60 * 1000, // Increased timeout for CI
  expect: {
    timeout: 10000 // Increased expect timeout
  },
  fullyParallel: true, // Re-enable parallel for faster execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Reduced retries
  workers: process.env.CI ? 2 : 3, // Optimized workers for CI
  reporter: [['html'], ['line']],
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Only run Firefox and Safari on main branch or for comprehensive testing
    ...(process.env.COMPREHENSIVE_TESTS === 'true' || process.env.GITHUB_REF === 'refs/heads/main' ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],
  webServer: {
    command: 'npx astro dev --port 4322',
    port: 4322,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for server startup
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
