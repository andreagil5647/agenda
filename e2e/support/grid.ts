import type { Page } from '@playwright/test';

const MINUTES_PER_DAY = 24 * 60;

export interface Point {
  x: number;
  y: number;
}

function minutesOf(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * The point on the screen that is the given time of day on the day grid, such as "21:00".
 * The grid scrolls, so it is first scrolled until that time is in the middle of it.
 */
export async function pointAtTime(page: Page, time: string): Promise<Point> {
  const fraction = minutesOf(time) / MINUTES_PER_DAY;
  const column = page.getByRole('list', { name: 'Blocks' });

  await column.evaluate((element, share) => {
    let scroller = element.parentElement;
    while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    if (scroller) {
      scroller.scrollTop = share * scroller.scrollHeight - scroller.clientHeight / 2;
    }
  }, fraction);

  const box = await column.boundingBox();
  if (!box) {
    throw new Error('The day grid is not on the page.');
  }
  return { x: box.x + box.width * 0.7, y: box.y + box.height * fraction };
}
