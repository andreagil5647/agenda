import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './e2e/support/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/** One window size for every test, so what is on screen does not depend on the machine. */
const viewport = { width: 1280, height: 800 };

export default defineConfig({
  testDir: './e2e',
  // The signed-in tests share one demo account, so they run one after another.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    // Fixed, so the day, the times and the language are the same everywhere the tests run.
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    trace: 'retain-on-failure',
  },
  projects: [
    // Opens a demo account once and saves its session for the signed-in tests.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'signed-in',
      testDir: './e2e/signed-in',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport, storageState: AUTH_FILE },
    },
    {
      name: 'visitor',
      testDir: './e2e/visitor',
      use: { ...devices['Desktop Chrome'], viewport },
    },
  ],
  // The web app is started if it is not already running. The API is not: it needs a database,
  // so it is started by the person or the workflow running the tests (see the README).
  webServer: {
    command: 'pnpm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
