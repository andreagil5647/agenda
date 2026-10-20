import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * Measurements, not tests: they print numbers for a person to read and fail on nothing, so they
 * are kept out of the normal run. `pnpm run perf:motion` runs them, with the API running.
 */
export default defineConfig({
  ...base,
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'perf',
      testDir: './e2e/perf',
      dependencies: ['setup'],
      timeout: 420_000,
      use: base.projects?.find((project) => project.name === 'signed-in')?.use ?? {},
    },
  ],
});
