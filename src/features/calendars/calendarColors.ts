/**
 * The colours a calendar can have. A calendar stores a key, not a colour; the
 * key selects a pair of tokens in styles/tokens.css through the
 * `data-calendar-color` attribute, so each theme can give it its own shades.
 */
export const CALENDAR_COLORS = [
  { key: 'blue', label: 'Blue' },
  { key: 'green', label: 'Green' },
  { key: 'purple', label: 'Purple' },
  { key: 'rose', label: 'Rose' },
] as const;

export const DEFAULT_CALENDAR_COLOR = CALENDAR_COLORS[0].key;
