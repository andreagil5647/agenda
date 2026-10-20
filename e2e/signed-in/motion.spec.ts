import { expect, test, type Locator, type Page } from '@playwright/test';
import { animatedProperties, finishAnimations, slowMotion } from '../support/animation';
import { pointAtTime } from '../support/grid';
import { openPlanner } from '../support/planner';
import { drag, HELD_BY_TOP_EDGE, topEdgeOf } from '../support/pointer';

/** The row of a task in the list. */
function rowOf(page: Page, title: string): Locator {
  return page
    .getByRole('region', { name: 'Tasks' })
    .getByRole('listitem')
    .filter({ hasText: title });
}

/** Clicks the empty grid at a time of day, which makes a block there. */
async function clickGridAt(page: Page, time: string): Promise<void> {
  const point = await pointAtTime(page, time);
  await page.mouse.click(point.x, point.y);
}

test.describe('finishing a task', () => {
  test('plays a burst from its tick box once, and a finished task plays nothing on load', async ({
    page,
  }) => {
    await openPlanner(page);
    const row = rowOf(page, 'Reply to Sam about the venue');
    await expect(row.locator('[data-burst]')).toHaveCount(0);
    await slowMotion(page);

    await row.getByRole('checkbox').click();

    const marks = row.locator('[data-burst] > *');
    await expect(marks).toHaveCount(6);
    // It really is animated, and only with what the compositor can do without touching the layout.
    expect(await animatedProperties(marks.first())).toEqual(['opacity', 'transform']);

    // It takes itself away when it is done, and the task stays finished.
    await finishAnimations(page);
    await expect(row.locator('[data-burst]')).toHaveCount(0);
    await expect(row.getByRole('checkbox')).toBeChecked();

    await page.reload();

    await expect(rowOf(page, 'Reply to Sam about the venue').getByRole('checkbox')).toBeChecked();
    await expect(page.locator('[data-burst]')).toHaveCount(0);
  });
});

test.describe('blocks on the grid', () => {
  test('a task dropped on the grid lands with a bounce, and nothing plays when the page loads', async ({
    page,
  }) => {
    await openPlanner(page);
    await expect(page.locator('[data-arrival]')).toHaveCount(0);
    await slowMotion(page);
    const grip = rowOf(page, 'Book dentist appointment').getByTitle('Drag onto the timeline');
    const grab = await topEdgeOf(grip);
    const at2200 = await pointAtTime(page, '22:00');

    await drag(page, grab, { x: at2200.x, y: at2200.y + HELD_BY_TOP_EDGE });
    await page.mouse.up();

    const landed = page.locator('[data-arrival="settle"]');
    await expect(landed).toHaveCount(1);
    await expect(landed).toContainText('Book dentist appointment');
    expect(await animatedProperties(landed)).toEqual(['transform']);

    await finishAnimations(page);
    await expect(page.locator('[data-arrival]')).toHaveCount(0);

    await page.reload();

    await expect(
      page.getByRole('button', { name: /^Book dentist appointment 22:00/ }),
    ).toBeVisible();
    await expect(page.locator('[data-arrival]')).toHaveCount(0);
  });

  test('a block made by clicking the grid grows, and is the same block once it is saved', async ({
    page,
  }) => {
    await openPlanner(page);
    await slowMotion(page);

    await clickGridAt(page, '05:00');

    const grown = page.locator('[data-arrival="grow"]');
    await expect(grown).toHaveCount(1);
    expect(await animatedProperties(grown)).toEqual(['opacity', 'transform']);
    // Saving swaps the id of the event; the block on screen must not be swapped with it, or its
    // animation would be cut off the moment the API answers.
    const node = await grown.elementHandle();
    await expect(grown.getByRole('button')).toHaveAttribute('aria-busy', 'false');
    expect(await node.evaluate((element) => element.isConnected)).toBe(true);
    await expect(grown).toHaveCount(1);

    await finishAnimations(page);
    await expect(page.locator('[data-arrival]')).toHaveCount(0);
  });

  test('a deleted block shrinks away instead of vanishing, and stays deleted after a reload', async ({
    page,
  }) => {
    await openPlanner(page);
    await slowMotion(page);
    await pointAtTime(page, '16:00');
    const block = page.getByRole('button', { name: /^Review pull requests/ });
    await block.focus();

    await page.keyboard.press('Delete');

    // The block itself is gone at once. What is left is a picture of it, which cannot be reached.
    await expect(block).toHaveCount(0);
    const leaving = page.locator('[data-leaving]');
    await expect(leaving).toHaveCount(1);
    await expect(leaving).toContainText('Review pull requests');
    await expect(leaving).toHaveAttribute('aria-hidden', 'true');
    expect(await animatedProperties(leaving)).toEqual(['opacity', 'transform']);

    await finishAnimations(page);
    await expect(leaving).toHaveCount(0);

    await page.reload();

    await expect(page.getByRole('button', { name: /^Stand-up/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Review pull requests/ })).toHaveCount(0);
  });

  test('blocks neither arrive nor leave with motion for a reader who asked for less, but still change', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPlanner(page);
    // Whatever would be shown is shown for an instant at the most, so watch for it appearing.
    await page.evaluate(() => {
      new MutationObserver(() => {
        if (document.querySelector('[data-arrival], [data-leaving]')) {
          document.documentElement.dataset.motionWasShown = 'true';
        }
      }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });
    const madeBefore = await page.getByRole('button', { name: /^New block/ }).count();
    await pointAtTime(page, '12:00');
    const block = page.getByRole('button', { name: /^Design review/ });
    await block.focus();

    await page.keyboard.press('Delete');
    await clickGridAt(page, '06:00');

    await expect(block).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^New block/ })).toHaveCount(madeBefore + 1);
    await expect(page.locator('html')).not.toHaveAttribute('data-motion-was-shown', 'true');
  });
});
