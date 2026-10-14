import { detectTheme, isThemeId, nextTheme, themeById, THEMES, type ThemeId } from './themes';

describe('isThemeId', () => {
  it('accepts every theme of the app', () => {
    for (const { id } of THEMES) {
      expect(isThemeId(id)).toBe(true);
    }
  });

  it.each([['sepia'], [''], [7], [null], [undefined], ['constructor']])('rejects %p', (value) => {
    expect(isThemeId(value)).toBe(false);
  });
});

describe('detectTheme', () => {
  it('gives Paper to a device that has chosen nothing', () => {
    expect(detectTheme(undefined, false)).toBe('paper');
  });

  it('gives Midnight to a device that has chosen nothing and is set to dark', () => {
    expect(detectTheme(undefined, true)).toBe('midnight');
  });

  it.each(THEMES)('keeps $id when it was chosen, whatever the device is set to', ({ id }) => {
    expect(detectTheme(id, true)).toBe(id);
    expect(detectTheme(id, false)).toBe(id);
  });
});

describe('nextTheme', () => {
  it('goes through the themes in order and starts again after the last', () => {
    const visited: ThemeId[] = [THEMES[0].id];
    for (let step = 1; step < THEMES.length; step += 1) {
      visited.push(nextTheme(visited[step - 1] ?? THEMES[0].id));
    }

    expect(visited).toEqual(THEMES.map(({ id }) => id));
    expect(nextTheme(visited[visited.length - 1] ?? THEMES[0].id)).toBe(THEMES[0].id);
  });
});

describe('themeById', () => {
  it.each(THEMES)('finds $id', (theme) => {
    expect(themeById(theme.id)).toBe(theme);
  });
});
