import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, readThemedColors } from '../../test/helpers/contrast';

const AA_TEXT = 4.5;
/** Boundaries of controls, and indicators such as focus, only need to be seen. */
const AA_GRAPHICS = 3;

const colors = readThemedColors(readFileSync(join(__dirname, 'tokens.css'), 'utf8'));
const themes = [
  ['light', colors.light],
  ['dark', colors.dark],
] as const;

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

describe.each(themes)('%s theme contrast', (_name, theme) => {
  it.each(PAIRS)('%s on %s is at least %s:1', (text, ground, minimum) => {
    const foreground = theme[text];
    const background = theme[ground];

    expect(foreground).toBeDefined();
    expect(background).toBeDefined();
    expect(contrastRatio(foreground ?? '', background ?? '')).toBeGreaterThanOrEqual(minimum);
  });

  it.each(CALENDARS)('the %s calendar text is readable on its own fill', (calendar) => {
    const text = theme[`calendar-${calendar}-text`];
    const surface = theme[`calendar-${calendar}-surface`];

    expect(text).toBeDefined();
    expect(surface).toBeDefined();
    expect(contrastRatio(text ?? '', surface ?? '')).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('tokens', () => {
  it('gives every calendar colour a fill, a text colour and an edge', () => {
    for (const calendar of CALENDARS) {
      for (const part of ['surface', 'text', 'stroke']) {
        expect(colors.light[`calendar-${calendar}-${part}`]).toBeDefined();
        expect(colors.dark[`calendar-${calendar}-${part}`]).toBeDefined();
      }
    }
  });
});
