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

const HEX_TOKEN = /--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi;
const ANY_TOKEN = /^\s*--([\w-]+):/gm;

/** The colour tokens written as a six-digit hex value, by name. Anything else is skipped. */
export function readColors(css: string): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const [, name, hex] of css.matchAll(HEX_TOKEN)) {
    if (name && hex) {
      colors[name] = hex;
    }
  }
  return colors;
}

/** The name of every custom property a stylesheet declares, whatever its value. */
export function readTokenNames(css: string): string[] {
  return Array.from(css.matchAll(ANY_TOKEN), ([, name]) => name ?? '');
}
