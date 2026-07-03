import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const isLinux = process.platform === 'linux';
const browsersLimited = process.env.BROWSER_INSTALL_FAILED === 'true' || process.env.PLAYWRIGHT_BROWSERS_LIMITED === 'true';
const runOptionalBrowsers = process.env.PLAYWRIGHT_OPTIONAL_BROWSERS === 'true';
// Only prefer system Chrome when explicitly requested and environment supports it
const preferSystemChrome = process.env.USE_SYSTEM_CHROME === 'true' && !process.env.ACT && !isLinux && !browsersLimited;

export default defineConfig({
  testDir: './tests/playwright',
  outputDir: './test-results',
  testIgnore: [
    // Temporarily exclude large problematic test files
    '**/accessibility-enhanced.spec.ts', // 545 lines - needs review
    '**/advanced-scenarios.spec.ts', // 539 lines - needs review
    '**/bundle-analysis.spec.ts', // 404 lines - breaking up due to timeouts
    '**/performance-monitoring.spec.ts', // 516 lines - run separately
    '**/chaos-engineering.spec.ts', // 423 lines - run separately
    // Exclude slow mobile device tests - replaced with optimized versions
    '**/mobile-navigation.spec.ts', // Use mobile-navigation-essential.spec.ts instead
    // Exclude slow visual regression tests - use essential visual tests
    // Exclude slow basic tests that timeout
    '**/basic.spec.ts', // Replace with optimized essential tests
    // Exclude other slow comprehensive tests
    '**/search-functionality.spec.ts', // High timeout rates
    '**/projects.spec.ts', // 20+ second timeouts
    '**/pages.spec.ts', // Inconsistent performance
    '**/user-journeys.spec.ts', // Some slow tests
  ],
  // Exclude debug-tagged specs (marked with // @debug) from default runs; can be included manually via CLI pattern
  grepInvert: /@debug/,
  timeout: 30 * 1000, // Reduced timeout for faster failure detection
  expect: {
    timeout: 5000, // Reduced expect timeout for faster feedback
    toHaveScreenshot: {
      pathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
    },
    toMatchSnapshot: {
      pathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
    },
  },
  fullyParallel: true, // Re-enable parallel for faster execution
  forbidOnly: !!process.env.CI,
  retries: isCI ? 2 : 1, // Reduced retries
  workers: isCI ? 2 : 3, // Optimized workers for CI
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['line'],
    // Add JUnit reporter for CI systems
  ['junit', { outputFile: 'test-results/junit.xml' }],
  // JSON reporter for flakiness tracking consumption
  ['json', { outputFile: 'playwright-report/test-results.json' }]
  ],
  use: {
  baseURL: 'http://localhost:4330',
    trace: 'off', // Disable tracing to avoid ffmpeg dependency
    actionTimeout: 5000, // Reduced for faster failure detection
    navigationTimeout: 15000, // Reduced navigation timeout
    // Disable video and screenshot to avoid ffmpeg requirement
    video: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: preferSystemChrome
        ? {
            ...devices['Desktop Chrome'],
            // Use system Chrome when explicitly enabled
            channel: 'chrome',
          }
        : {
            // Default to bundled Chromium for maximum portability
            ...devices['Desktop Chrome'],
          },
    },
    // Run Firefox/WebKit only when explicitly requested. This keeps local QA
    // reliable when Playwright's optional browser binaries drift out of sync.
    ...(runOptionalBrowsers && !(isCI && (isLinux || browsersLimited)) ? [
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
    // Keep preview on the same baseURL port; strictPort prevents silent drift to 4331+.
    command: 'npm run preview -- --port 4330 --strictPort',
    port: 4330,
    // Reuse an existing local preview when available to avoid baseURL/preview races.
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
