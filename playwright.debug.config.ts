import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 60 * 1000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium-debug',
      use: { 
        ...devices['Desktop Chrome'],
        // Extra debugging options
        launchOptions: {
          slowMo: 100, // Slow down actions
          headless: false, // Show browser (if display available)
        }
      },
    },
  ],
  webServer: undefined, // We're managing the server manually
});
