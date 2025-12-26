import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for StockENT E2E Tests
 * Following pitch-point pattern - simple and fast
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter - simple format like pitch-point
  reporter: process.env.CI ? 'github' : 'list',

  // Test timeout
  timeout: 60000,

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.CI ? 'http://localhost:3000' : 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure only
    screenshot: 'only-on-failure',
  },

  // Configure projects for browsers
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

  // No webServer config - app is started separately in CI
  // For local development, start the app manually before running tests
});
