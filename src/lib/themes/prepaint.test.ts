import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setDeviceColorScheme } from '../../../test/helpers/colorScheme';
import { detectTheme, THEMES, type ThemeId } from './themes';

const KEY = 'agenda.preferences';
const html = readFileSync(join(__dirname, '../../index.html'), 'utf8');
const page = new DOMParser().parseFromString(html, 'text/html');
const script = page.querySelector('script')?.textContent ?? '';
const initialColor = page.querySelector('meta[name="theme-color"]')?.getAttribute('content');

/** Every combination of a saved theme (or none) and a device set to dark or not. */
const CHOICES: [saved: ThemeId | undefined, dark: boolean][] = [
  undefined,
  ...THEMES.map(({ id }) => id),
].flatMap((saved) => [
  [saved, false],
  [saved, true],
]);

/** Runs the script from index.html the way the browser does, on a page that has not painted. */
function loadPage(): { theme: string | undefined; color: string | null | undefined } {
  document.head.innerHTML = `<meta name="theme-color" content="${initialColor ?? ''}" />`;
  const element = document.createElement('script');
  element.textContent = script;
  document.head.append(element);
  return {
    theme: document.documentElement.dataset.theme,
    color: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
  };
}

function save(preferences: unknown): void {
  window.localStorage.setItem(KEY, JSON.stringify(preferences));
}

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.head.innerHTML = '';
  jest.restoreAllMocks();
});

describe('the script that picks the theme before the first paint', () => {
  it('is in the page', () => {
    expect(script).not.toBe('');
  });

  it('gives a device that has chosen nothing Paper, or Midnight if the device is set to dark', () => {
    setDeviceColorScheme('light');
    expect(loadPage().theme).toBe('paper');

    setDeviceColorScheme('dark');
    expect(loadPage().theme).toBe('midnight');
  });

  it('starts the page in the colour of the default theme, for when scripts do not run', () => {
    expect(initialColor).toBe(THEMES[0].themeColor);
  });

  it.each(THEMES)(
    'applies $id when it is the saved choice, whatever the device prefers',
    (theme) => {
      setDeviceColorScheme(theme.scheme === 'dark' ? 'light' : 'dark');
      save({ theme: theme.id });

      expect(loadPage()).toEqual({ theme: theme.id, color: theme.themeColor });
    },
  );

  it.each([
    ['a theme the app does not have', { theme: 'sepia' }],
    ['a theme of the wrong type', { theme: 7 }],
    ['an object key that is not a theme', { theme: 'constructor' }],
    ['no theme', { language: 'es' }],
  ])('ignores %s and follows the device', (_name, preferences) => {
    setDeviceColorScheme('dark');
    save(preferences);

    expect(loadPage().theme).toBe('midnight');
  });

  it.each([
    ['text that is not JSON', 'not json at all'],
    ['JSON that is not an object', 'null'],
  ])('ignores %s and follows the device', (_name, stored) => {
    setDeviceColorScheme('dark');
    window.localStorage.setItem(KEY, stored);

    expect(loadPage().theme).toBe('midnight');
  });

  it('follows the device when the storage refuses to be read', () => {
    setDeviceColorScheme('dark');
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(loadPage().theme).toBe('midnight');
  });

  it.each(CHOICES)('chooses what the app chooses for saved %s, dark device %s', (saved, dark) => {
    setDeviceColorScheme(dark ? 'dark' : 'light');
    if (saved) save({ theme: saved });

    expect(loadPage().theme).toBe(detectTheme(saved, dark));
  });

  it('knows exactly the themes the app has', () => {
    const known: ThemeId[] = [];
    for (const { id } of THEMES) {
      save({ theme: id });
      if (loadPage().theme === id) known.push(id);
    }

    expect(known).toEqual(THEMES.map(({ id }) => id));
  });
});
