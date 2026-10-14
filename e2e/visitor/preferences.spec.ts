import { expect, test } from '@playwright/test';
import { THEMES } from '../../src/lib/themes/themes';

const PREFERENCES_KEY = 'agenda.preferences';

test.describe('a theme the reader chose', () => {
  for (const { id, themeColor } of THEMES) {
    test(`is on the page and in the browser bar before the app has loaded: ${id}`, async ({
      page,
    }) => {
      await page.addInitScript(
        ({ key, theme }) => {
          localStorage.setItem(key, JSON.stringify({ theme }));
        },
        { key: PREFERENCES_KEY, theme: id },
      );
      // Without its bundle the page is only what index.html does on its own.
      await page.route('**/js/*.js', (route) => route.abort());

      await page.goto('/');

      await expect(page.locator('html')).toHaveAttribute('data-theme', id);
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', themeColor);
    });
  }

  test('is chosen from the list, applied at once and kept after a reload', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Choose a theme' }).click();
    await page
      .getByRole('group', { name: 'Theme' })
      .getByRole('button', { name: 'Arcade' })
      .click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'arcade');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(12, 15, 36)');
    // Choosing gives the focus back to the button that opened the list.
    await expect(page.getByRole('button', { name: 'Choose a theme' })).toBeFocused();

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'arcade');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(12, 15, 36)');
  });

  test('is revealed by a view transition that grows from the button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Theme: Paper/ })).toBeVisible();

    const revealed = await page.evaluate(async () => {
      const button = document.querySelector<HTMLButtonElement>('button[aria-label^="Theme:"]');
      button?.click();
      await new Promise((resolve) => setTimeout(resolve, 80));
      return document.getAnimations().some((animation) => {
        const effect = animation.effect;
        return (
          effect instanceof KeyframeEffect && effect.pseudoElement === '::view-transition-new(root)'
        );
      });
    });

    expect(revealed).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'arcade');
  });

  test('appears at once, with no view transition, for a reader who asked for less motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Theme: Paper/ })).toBeVisible();

    const revealed = await page.evaluate(async () => {
      document.querySelector<HTMLButtonElement>('button[aria-label^="Theme:"]')?.click();
      await new Promise((resolve) => setTimeout(resolve, 80));
      return document.getAnimations().some((animation) => {
        const effect = animation.effect;
        return (
          effect instanceof KeyframeEffect && effect.pseudoElement === '::view-transition-new(root)'
        );
      });
    });

    expect(revealed).toBe(false);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'arcade');
  });
});

test('the language is chosen from the corner, applied at once and kept after a reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Give every task a time.' })).toBeVisible();

  await page.getByRole('button', { name: 'Español' }).click();

  await expect(page.getByRole('heading', { name: 'Dale una hora a cada tarea.' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Dale una hora a cada tarea.' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test.describe('at phone width', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const language of ['en', 'es']) {
    for (const { id } of THEMES) {
      test(`the sign-in screen does not scroll sideways: ${id}, ${language}`, async ({ page }) => {
        await page.addInitScript(
          ({ key, theme, lang }) => {
            localStorage.setItem(key, JSON.stringify({ theme, language: lang }));
          },
          { key: PREFERENCES_KEY, theme: id, lang: language },
        );

        await page.goto('/');
        await expect(
          page.getByRole('button', { name: /^(Try the demo|Probar la demo)$/ }),
        ).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }
});
