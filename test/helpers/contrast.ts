/** WCAG 2.x contrast between two six-digit hex colours, from 1 (identical) to 21. */

function channel(hex: string, start: number): number {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

export function contrastRatio(first: string, second: string): number {
  const [lighter = 0, darker = 0] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (left, right) => right - left,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ThemedColors {
  light: Record<string, string>;
  dark: Record<string, string>;
}

const LIGHT_DARK_TOKEN = /--([\w-]+):\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/gi;

/** The colour tokens written as light-dark(#hex, #hex), by name, for each theme. */
export function readThemedColors(css: string): ThemedColors {
  const colors: ThemedColors = { light: {}, dark: {} };
  for (const [, name, light, dark] of css.matchAll(LIGHT_DARK_TOKEN)) {
    if (name && light && dark) {
      colors.light[name] = light;
      colors.dark[name] = dark;
    }
  }
  return colors;
}
