import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, readColors, readTokenNames } from '../../test/helpers/contrast';
import { THEMES } from '../lib/themes/themes';

const AA_TEXT = 4.5;
/** Boundaries of controls, and indicators such as focus, only need to be seen. */
const AA_GRAPHICS = 3;

function readTheme(id: string): string {
  return readFileSync(join(__dirname, 'themes', `${id}.css`), 'utf8');
}

/** Pairs of tokens that appear together, and the contrast they owe each other. */
const PAIRS: readonly (readonly [text: string, ground: string, minimum: number])[] = [
  ['color-text', 'color-bg', AA_TEXT],
  ['color-text', 'color-surface', AA_TEXT],
  ['color-text-label', 'color-surface', AA_TEXT],
  ['color-text-muted', 'color-bg', AA_TEXT],
  ['color-text-muted', 'color-surface', AA_TEXT],
  ['color-text-muted', 'color-surface-muted', AA_TEXT],
  ['color-text-subtle', 'color-bg', AA_TEXT],
  ['color-text-subtle', 'color-surface', AA_TEXT],
  ['color-accent', 'color-bg', AA_TEXT],
  ['color-accent', 'color-surface', AA_TEXT],
  ['color-on-accent', 'color-accent', AA_TEXT],
  ['color-on-accent', 'color-accent-hover', AA_TEXT],
  ['color-accent-soft-text', 'color-accent-soft', AA_TEXT],
  ['color-danger-text', 'color-danger-surface', AA_TEXT],
  ['color-border-strong', 'color-surface', AA_GRAPHICS],
  ['color-border-strong', 'color-bg', AA_GRAPHICS],
  ['color-focus', 'color-bg', AA_GRAPHICS],
  ['color-focus', 'color-surface', AA_GRAPHICS],
  ['color-now', 'color-surface', AA_GRAPHICS],
];

const CALENDARS = ['blue', 'green', 'purple', 'rose', 'peach', 'butter'];

describe.each(THEMES)('the $id theme', ({ id, scheme, themeColor }) => {
  const css = readTheme(id);
  const colors = readColors(css);

  it.each(PAIRS)('has %s on %s at least %s:1', (text, ground, minimum) => {
    const foreground = colors[text];
    const background = colors[ground];

    expect(foreground).toBeDefined();
    expect(background).toBeDefined();
    expect(contrastRatio(foreground ?? '', background ?? '')).toBeGreaterThanOrEqual(minimum);
  });

  it.each(CALENDARS)('has readable %s calendar text on its own fill', (calendar) => {
    const text = colors[`calendar-${calendar}-text`];
    const surface = colors[`calendar-${calendar}-surface`];

    expect(text).toBeDefined();
    expect(surface).toBeDefined();
    expect(contrastRatio(text ?? '', surface ?? '')).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('gives every calendar colour a fill, a text colour and an edge', () => {
    for (const calendar of CALENDARS) {
      for (const part of ['surface', 'text', 'stroke']) {
        expect(colors[`calendar-${calendar}-${part}`]).toBeDefined();
      }
    }
  });

  it('declares the same tokens as every other theme', () => {
    const names = readTokenNames(css).sort();
    const reference = readTokenNames(readTheme(THEMES[0].id)).sort();

    expect(names).toEqual(reference);
  });

  it('is the scheme the list of themes says it is', () => {
    expect(css).toContain(`color-scheme: ${scheme};`);
  });

  it('paints the browser bar with the colour of its page', () => {
    expect(colors['color-bg']).toBe(themeColor);
  });
});
