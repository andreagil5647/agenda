import type { Locator, Page } from '@playwright/test';
import type { Point } from './grid';

/** How far in from the top edge an item is held, so that its top edge is where the pointer is. */
export const HELD_BY_TOP_EDGE = 4;

/**
 * Presses on `grab`, drags to `to` and lets go. The pointer travels in small steps, because a
 * drag that jumps is not seen by the grid as having crossed anything on the way.
 */
export async function drag(page: Page, grab: Point, to: Point): Promise<void> {
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x + 6, grab.y + 6, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 20 });
}

/** A point just inside the top edge of an element, which is how the app reads where it is. */
export async function topEdgeOf(element: Locator): Promise<Point> {
  const box = await element.boundingBox();
  if (!box) {
    throw new Error('The element is not on the page.');
  }
  return { x: box.x + box.width / 2, y: box.y + HELD_BY_TOP_EDGE };
}
