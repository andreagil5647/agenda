/**
 * The themes of the app, in the order the switch goes through them. A theme is
 * a complete look, defined as tokens in `styles/themes/<id>.css`; this list is
 * what the rest of the app knows about each one.
 *
 * `themeColor` is the colour the browser paints its own bar with, so it is the
 * page colour of the theme. A test keeps it equal to `--color-bg` in the
 * stylesheet.
 */
export const THEMES = [
  { id: 'paper', scheme: 'light', themeColor: '#fbf5ea' },
  { id: 'midnight', scheme: 'dark', themeColor: '#1b1620' },
] as const;

export type Theme = (typeof THEMES)[number];

export type ThemeId = Theme['id'];

/** Whether a value read from outside the app, such as storage, is one of the themes. */
export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function themeById(id: ThemeId): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

/**
 * The theme to start in: the saved choice, otherwise Paper, or Midnight on a
 * device set to dark. The script in index.html does the same before the app
 * has loaded; prepaint.test.ts keeps the two in step.
 */
export function detectTheme(saved: ThemeId | undefined, prefersDark: boolean): ThemeId {
  return saved ?? (prefersDark ? 'midnight' : 'paper');
}

/** The theme after this one, going back to the first after the last. */
export function nextTheme(id: ThemeId): ThemeId {
  const index = THEMES.findIndex((theme) => theme.id === id);
  return (THEMES[(index + 1) % THEMES.length] ?? THEMES[0]).id;
}
