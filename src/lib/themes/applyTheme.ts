import { themeById, type ThemeId } from './themes';

/** Puts a theme on the page: its tokens, and the colour of the browser's own bar. */
export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', themeById(id).themeColor);
}

export function deviceIsSetToDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
