import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const isLinux = process.platform === 'linux';
const browsersLimited =
  process.env.BROWSER_INSTALL_FAILED === 'true' ||
  process.env.PLAYWRIGHT_BROWSERS_LIMITED === 'true';
const runOptionalBrowsers = process.env.PLAYWRIGHT_OPTIONAL_BROWSERS === 'true';
const runExtended = process.env.PLAYWRIGHT_EXTENDED === 'true';
// Only prefer system Chrome when explicitly requested and environment supports it
const preferSystemChrome =
  process.env.USE_SYSTEM_CHROME === 'true' && !process.env.ACT && !isLinux && !browsersLimited;

export default defineConfig({
  testDir: './tests/playwright',
  outputDir: './test-results',
  // Heavy / opt-in suites use @extended and are excluded via grepInvert unless
  // PLAYWRIGHT_EXTENDED=true (see test:e2e:extended / test:e2e:device-matrix).
  // Default visual CI: visual-smoke.spec.ts + component-visual-baselines.spec.ts
  testIgnore: runExtended ? [] : ['**/mobile-navigation.spec.ts'],
  // Exclude debug-tagged specs from default runs; @extended requires PLAYWRIGHT_EXTENDED=true
  grepInvert: runExtended ? /@debug/ : /@debug|@extended/,
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
    ['json', { outputFile: 'playwright-report/test-results.json' }],
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
    ...(runOptionalBrowsers && !(isCI && (isLinux || browsersLimited))
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),
  ],
  webServer: {
    // Keep preview on the same baseURL port; strictPort prevents silent drift to 4331+.
    // Use `pnpm exec astro` (not `pnpm run preview -- --port`) so the port flags
    // reach Astro — a stray `--` makes Astro fall back to 4321 and Playwright times out.
    command: 'pnpm exec astro preview --port 4330 --strictPort',
    port: 4330,
    // Never reuse a stale local process; the suite must exercise the current build.
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'production',
    },
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
