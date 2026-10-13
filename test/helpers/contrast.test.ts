import { contrastRatio, readThemedColors } from './contrast';

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour against itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#336699', '#336699')).toBe(1);
  });

  it('does not depend on which colour is the text', () => {
    expect(contrastRatio('#1e6b57', '#fffcf5')).toBe(contrastRatio('#fffcf5', '#1e6b57'));
  });

  it('matches a published value', () => {
    // #767676 on white is the usual example of the lightest grey that passes 4.5:1.
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });
});

describe('readThemedColors', () => {
  it('reads both sides of a light-dark() token', () => {
    const colors = readThemedColors('--color-bg: light-dark(#fbf5ea, #1b1620);');

    expect(colors.light['color-bg']).toBe('#fbf5ea');
    expect(colors.dark['color-bg']).toBe('#1b1620');
  });

  it('skips tokens that are not a pair of hex colours', () => {
    const colors = readThemedColors(
      '--a: #ffffff; --b: var(--a); --c: light-dark(rgb(0 0 0 / 8%), rgb(0 0 0 / 40%));',
    );

    expect(colors.light).toEqual({});
  });
});
