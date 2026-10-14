/**
 * How times and dates are written for the user. Pure: the locale and the
 * preferences are passed in, so the words and marks follow the language of
 * the screen and the hour cycle follows the account.
 */

import { MINUTES_PER_DAY } from './zonedTime';

export type HourCycle = 'h12' | 'h23';

const MINUTES_PER_HOUR = 60;

// Building a formatter is far dearer than using one, and the grid writes dozens of times.
const timeFormatters = new Map<string, Intl.DateTimeFormat>();

function timeFormatterFor(locale: string, hourCycle: HourCycle): Intl.DateTimeFormat {
  const key = `${locale}|${hourCycle}`;
  let formatter = timeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      hourCycle,
      hour: hourCycle === 'h23' ? '2-digit' : 'numeric',
      minute: '2-digit',
    });
    timeFormatters.set(key, formatter);
  }
  return formatter;
}

/** A time of day such as "09:30", "9:30 AM" or "9:30 a. m.", from minutes after midnight. */
export function formatTimeOfDay(minutes: number, hourCycle: HourCycle, locale: string): string {
  // A time of day has no zone of its own; reading it as UTC keeps the wall clock as it is.
  // The end of the day (24:00) rolls over to midnight.
  return timeFormatterFor(locale, hourCycle).format(new Date(Date.UTC(1970, 0, 1, 0, minutes)));
}

/** A range of times of day, such as "09:30 – 11:00". */
export function formatTimeRange(
  start: number,
  end: number,
  hourCycle: HourCycle,
  locale: string,
): string {
  return `${formatTimeOfDay(start, hourCycle, locale)} – ${formatTimeOfDay(end, hourCycle, locale)}`;
}

/**
 * A time as a time input holds it, "HH:MM" in 24 hours. This is a value for the
 * browser, not text for the reader, so it never depends on the language.
 */
export function formatTimeInputValue(minutes: number): string {
  const wrapped = minutes % MINUTES_PER_DAY;
  const hour = Math.floor(wrapped / MINUTES_PER_HOUR);
  const minute = wrapped % MINUTES_PER_HOUR;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Minutes after midnight for an "HH:MM" value, as a time input reports it. */
export function parseTimeOfDay(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const minutes = Number(match[1]) * MINUTES_PER_HOUR + Number(match[2]);
  return minutes < MINUTES_PER_DAY && Number(match[2]) < MINUTES_PER_HOUR ? minutes : null;
}

function unitFormatter(locale: string, unit: 'hour' | 'minute'): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' });
}

/** A length of time such as "45 min", "1 hr" or "1 hr 30 min", in the units of the language. */
export function formatDuration(minutes: number, locale: string): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  const parts: string[] = [];
  if (hours > 0) parts.push(unitFormatter(locale, 'hour').format(hours));
  if (rest > 0 || hours === 0) parts.push(unitFormatter(locale, 'minute').format(rest));
  return new Intl.ListFormat(locale, { type: 'unit', style: 'narrow' }).format(parts);
}

/** A calendar date written out, such as "Monday, 12 October" or "lunes, 12 de octubre". */
export function formatDayHeading(date: string, locale: string): string {
  // The date has no zone of its own; formatting it at noon UTC keeps it on the same day.
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00.000Z`));
}
