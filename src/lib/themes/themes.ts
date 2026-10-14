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
