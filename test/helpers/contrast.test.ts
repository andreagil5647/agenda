import { contrastRatio, readColors, readTokenNames } from './contrast';

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

describe('readColors', () => {
  it('reads a token written as a hex colour', () => {
    expect(readColors('--color-bg: #fbf5ea;')).toEqual({ 'color-bg': '#fbf5ea' });
  });

  it('skips tokens that are not a hex colour', () => {
    const colors = readColors('--a: #ffffff; --b: var(--a); --c: rgb(0 0 0 / 8%); --d: #fff;');

    expect(colors).toEqual({ a: '#ffffff' });
  });
});

describe('readTokenNames', () => {
  it('lists every custom property, whatever its value', () => {
    const css = `:root {
      --a: #ffffff;
      --b: var(--a);
      color: red;
      --c: 0 1px 2px;
    }`;

    expect(readTokenNames(css)).toEqual(['a', 'b', 'c']);
  });
});
