import { expect, test } from '@playwright/test';
import { animatedProperties, finishAnimations, slowMotion } from '../support/animation';

// Finishing every task would leave the shared demo account of the signed-in tests with nothing to
// plan, so this one opens an account of its own.
test('finishing the last open task is a bigger moment, with a line of praise', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the demo' }).click();
  await expect(page.getByRole('checkbox', { name: 'Draft launch checklist' })).toBeVisible();
  const tasks = page.getByRole('region', { name: 'Tasks' });
  const praise = tasks.getByRole('status').filter({ hasText: /\S/ });
  const open = tasks.getByRole('checkbox', { checked: false });

  // All but the last: an ordinary moment, and no praise yet.
  while ((await open.count()) > 1) {
    await open.first().click();
    await finishAnimations(page);
  }
  await expect(praise).toHaveCount(0);
  await expect(page.locator('[data-burst]')).toHaveCount(0);
  await slowMotion(page);

  await open.first().click();

  const burst = page.locator('[data-burst]');
  await expect(burst).toHaveAttribute('data-size', 'large');
  await expect(burst.locator('> *')).toHaveCount(12);
  expect(await animatedProperties(burst.locator('> *').first())).toEqual(['opacity', 'transform']);
  await expect(praise).toHaveText('Every task is done. Enjoy the rest of your day.');
  await expect(praise).toHaveAttribute('data-moment');
  expect(await animatedProperties(praise)).toEqual(['opacity', 'transform']);

  await finishAnimations(page);
  await expect(burst).toHaveCount(0);

  // The line stays for a list that is clear, but the moment is over.
  await page.reload();
  await expect(praise).toHaveText('Every task is done. Enjoy the rest of your day.');
  await expect(praise).not.toHaveAttribute('data-moment');
});
