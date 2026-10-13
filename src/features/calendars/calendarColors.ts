import type { PlainMessageKey } from '../../lib/i18n/catalogues';

/**
 * The colours a calendar can have. A calendar stores a key, not a colour; the
 * key selects a pair of tokens in styles/tokens.css through the
 * `data-calendar-color` attribute, so each theme can give it its own shades.
 */
export const CALENDAR_COLORS = [
  { key: 'blue', label: 'calendars.colors.blue' },
  { key: 'green', label: 'calendars.colors.green' },
  { key: 'purple', label: 'calendars.colors.purple' },
  { key: 'rose', label: 'calendars.colors.rose' },
] as const satisfies readonly { key: string; label: PlainMessageKey }[];

export const DEFAULT_CALENDAR_COLOR = CALENDAR_COLORS[0].key;
