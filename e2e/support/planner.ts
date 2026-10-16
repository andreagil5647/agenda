import { expect, type Page } from '@playwright/test';

/** Opens the planner and waits until its day, its tasks and its calendars have all loaded. */
export async function openPlanner(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Stand-up/ })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Draft launch checklist' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Calendars' }).getByRole('listitem'),
  ).not.toHaveCount(0);
}
