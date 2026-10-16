import { expect, test } from '@playwright/test';
import { THEMES } from '../../src/lib/themes/themes';
import { pointAtTime } from '../support/grid';
import { openPlanner } from '../support/planner';
import { drag, HELD_BY_TOP_EDGE, topEdgeOf } from '../support/pointer';

/** The height of one hour on the grid, which the app lays out by. */
const HOUR_PX = 56;

test('a task added is still there after a reload', async ({ page }) => {
  await openPlanner(page);
  const title = `Water the plants ${Date.now()}`;

  await page.getByRole('textbox', { name: 'New task' }).fill(title);
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('checkbox', { name: title })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('checkbox', { name: title })).toBeVisible();
});

test('a task dragged onto the grid becomes a block that is still there after a reload', async ({
  page,
}) => {
  await openPlanner(page);
  const task = 'Write release notes';
  const block = new RegExp(`^${task} 21:00 – 21:45`);
  const grip = page
    .getByRole('region', { name: 'Tasks' })
    .getByRole('listitem')
    .filter({ hasText: task })
    .getByTitle('Drag onto the timeline');
  const grab = await topEdgeOf(grip);
  const at2100 = await pointAtTime(page, '21:00');

  await drag(page, grab, { x: at2100.x, y: at2100.y + HELD_BY_TOP_EDGE });
  // While it is held, the grid shows where it would land.
  await expect(
    page.getByRole('list', { name: 'Blocks' }).locator('li[aria-hidden="true"]', {
      hasText: '21:00',
    }),
  ).toBeVisible();
  await page.mouse.up();

  await expect(page.getByRole('button', { name: block })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('button', { name: block })).toBeVisible();
});

test('a block dragged to another time moves, and pulling its edge changes its length, and both are still so after a reload', async ({
  page,
}) => {
  await openPlanner(page);
  await pointAtTime(page, '18:30');
  const gym = page.getByRole('button', { name: /^Gym 18:30 – 19:30/ });

  // Up one hour, by its top edge.
  const grab = await topEdgeOf(gym);
  await drag(page, grab, { x: grab.x, y: grab.y - HOUR_PX });
  await page.mouse.up();
  const moved = page.getByRole('button', { name: /^Gym 17:30 – 18:30/ });
  await expect(moved).toBeVisible();

  // Half an hour longer, by pulling its bottom edge down.
  const box = await moved.boundingBox();
  if (!box) throw new Error('The block is not on the page.');
  const edge = { x: box.x + box.width / 2, y: box.y + box.height - 5 };
  await drag(page, edge, { x: edge.x, y: edge.y + HOUR_PX / 2 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: /^Gym 17:30 – 19:00/ })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('button', { name: /^Gym 17:30 – 19:00/ })).toBeVisible();
});

test.describe('at phone width', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const { id } of THEMES) {
    test(`the planner does not scroll sideways: ${id}`, async ({ page }) => {
      await page.addInitScript((theme) => {
        localStorage.setItem('agenda.preferences', JSON.stringify({ theme }));
      }, id);

      await openPlanner(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  const LANGUAGES = {
    en: { account: 'Account', logOut: 'Log out' },
    es: { account: 'Cuenta', logOut: 'Cerrar sesión' },
  };

  for (const [language, words] of Object.entries(LANGUAGES)) {
    for (const name of ['Demo User', 'Alexandria Montgomery-Featherstonehaugh']) {
      test(`the top bar keeps the avatar, the name and Log out apart: ${name}, ${language}`, async ({
        page,
      }) => {
        await page.addInitScript((lang) => {
          localStorage.setItem('agenda.preferences', JSON.stringify({ language: lang }));
        }, language);
        await page.goto('/');
        const account = page.getByRole('complementary', { name: words.account });
        await expect(account.getByRole('button', { name: words.logOut })).toBeVisible();
        // A name of any length: the page shows what the account says, so the test says it too.
        await account.getByText('Demo User').evaluate((element, text) => {
          element.textContent = text;
        }, name);

        const [avatar, label, logOut] = await Promise.all([
          account.locator('span[aria-hidden="true"]').boundingBox(),
          account.getByText(name).boundingBox(),
          account.getByRole('button', { name: words.logOut }).boundingBox(),
        ]);
        if (!avatar || !label || !logOut) throw new Error('The top bar is missing a part.');

        expect(avatar.x + avatar.width).toBeLessThanOrEqual(label.x);
        expect(label.x + label.width).toBeLessThanOrEqual(logOut.x);
        expect(logOut.x + logOut.width).toBeLessThanOrEqual(360);
      });
    }
  }
});
