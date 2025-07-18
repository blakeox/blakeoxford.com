import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 60 * 1000, // Increased timeout for CI
  expect: {
    timeout: 10000 // Increased expect timeout
  },
  fullyParallel: false, // Disable parallel for server stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // More retries for CI
  workers: process.env.CI ? 1 : 2, // Fewer workers for stability
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
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
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
