import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 20_000,
  },
  projects: [
    {
      name: 'chrome-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 920 },
      },
    },
    {
      name: 'mobile-320',
      use: {
        ...devices['iPhone SE'],
        browserName: 'chromium',
        viewport: { width: 320, height: 568 },
      },
    },
    {
      name: 'mobile-375',
      use: {
        ...devices['iPhone 12'],
        browserName: 'chromium',
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'mobile-414',
      use: {
        ...devices['iPhone 12 Pro Max'],
        browserName: 'chromium',
        viewport: { width: 414, height: 736 },
      },
    },
    {
      name: 'tablet-768',
      use: {
        ...devices['iPad Mini'],
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
});
