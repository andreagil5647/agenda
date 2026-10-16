import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE } from './support/auth';

setup('opens a demo account and keeps its session', async ({ page, request }) => {
  const health = await request.get('/api/v1/health').catch(() => null);
  expect(
    health?.ok(),
    'The API is not answering. Start it on the port the dev server proxies to (4000).',
  ).toBe(true);

  await page.goto('/');
  await page.getByRole('button', { name: 'Try the demo' }).click();

  await expect(page.getByRole('region', { name: 'Timeline' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Stand-up/ })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
