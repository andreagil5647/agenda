import { expect, test, type Locator, type Page } from '@playwright/test';
import { openPlanner } from '../support/planner';

/** What a keyframe carries besides the properties it animates. */
const KEYFRAME_BOOKKEEPING = new Set(['offset', 'easing', 'composite', 'computedOffset']);

/** The row of a task in the list. */
function rowOf(page: Page, title: string): Locator {
  return page
    .getByRole('region', { name: 'Tasks' })
    .getByRole('listitem')
    .filter({ hasText: title });
}

test('finishing a task plays a burst from its tick box once, and a finished task plays nothing on load', async ({
  page,
}) => {
  await openPlanner(page);
  const row = rowOf(page, 'Reply to Sam about the venue');
  await expect(row.locator('[data-burst]')).toHaveCount(0);

  await row.getByRole('checkbox').click();

  const marks = row.locator('[data-burst] > *');
  await expect(marks).toHaveCount(6);
  // It really is animated, and only with what the compositor can do without touching the layout.
  const animated = await marks.first().evaluate((mark) =>
    mark.getAnimations().flatMap((animation) => {
      const effect = animation.effect;
      return effect instanceof KeyframeEffect
        ? effect.getKeyframes().flatMap((frame) => Object.keys(frame))
        : [];
    }),
  );
  const properties = new Set(animated.filter((property) => !KEYFRAME_BOOKKEEPING.has(property)));
  expect([...properties].sort()).toEqual(['opacity', 'transform']);

  // It takes itself away when it is done, and the task stays finished.
  await expect(row.locator('[data-burst]')).toHaveCount(0);
  await expect(row.getByRole('checkbox')).toBeChecked();

  await page.reload();

  await expect(rowOf(page, 'Reply to Sam about the venue').getByRole('checkbox')).toBeChecked();
  await expect(page.locator('[data-burst]')).toHaveCount(0);
});

test('finishing a task shows no burst to a reader who asked for less motion, and still finishes it', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPlanner(page);
  const row = rowOf(page, 'Plan next sprint');
  // With no motion a burst would be over in an instant, so look at it the moment it appears
  // rather than afterwards, when it would be gone either way.
  await page.evaluate(() => {
    new MutationObserver(() => {
      const burst = document.querySelector('[data-burst]');
      if (burst && getComputedStyle(burst).display !== 'none') {
        document.documentElement.dataset.burstWasShown = 'true';
      }
    }).observe(document.body, { childList: true, subtree: true });
  });

  await row.getByRole('checkbox').click();

  await expect(row.getByRole('checkbox')).toBeChecked();
  await expect(page.locator('html')).not.toHaveAttribute('data-burst-was-shown', 'true');
});
