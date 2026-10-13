/**
 * Conversions between instants and the wall clock of an IANA time zone, built
 * on Intl.DateTimeFormat. The planner lays days out in the account's zone, not
 * the browser's, so nothing here reads the local zone or the current time.
 *
 * A calendar date is a `YYYY-MM-DD` string and a time of day is a number of
 * minutes from midnight.
 */

export const MINUTES_PER_DAY = 24 * 60;
const MINUTE_MS = 60_000;

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

function wallClockAt(instant: Date, timeZone: string): WallClock {
  const fields: Record<string, number> = {};
  for (const { type, value } of formatterFor(timeZone).formatToParts(instant)) {
    fields[type] = Number(value);
  }
  return {
    year: fields.year ?? 0,
    month: fields.month ?? 1,
    day: fields.day ?? 1,
    hour: fields.hour ?? 0,
    minute: fields.minute ?? 0,
  };
}

function parseDate(date: string): { year: number; month: number; day: number } {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return { year, month, day };
}

function toDateString(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** How far the zone's wall clock is ahead of UTC at `instant`, in milliseconds. */
function utcOffsetAt(instant: Date, timeZone: string): number {
  const { year, month, day, hour, minute } = wallClockAt(instant, timeZone);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  return wallClockAsUtc - Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS;
}

/** The calendar date an instant falls on in `timeZone`. */
export function localDateOf(instant: Date, timeZone: string): string {
  const { year, month, day } = wallClockAt(instant, timeZone);
  return toDateString(year, month, day);
}

/** The time of day an instant falls on in `timeZone`, in minutes from midnight. */
export function minutesOfDay(instant: Date, timeZone: string): number {
  const { hour, minute } = wallClockAt(instant, timeZone);
  return hour * 60 + minute;
}

/**
 * The instant at which the wall clock in `timeZone` shows `minutes` from
 * midnight on `date`.
 *
 * The offset depends on the instant being looked for, so it is resolved in
 * two passes: the first guess lands within a transition's width of the
 * answer, and the second uses the offset in force there. A wall time skipped
 * by a spring-forward change resolves to the time after the gap.
 */
export function instantAt(date: string, minutes: number, timeZone: string): Date {
  const { year, month, day } = parseDate(date);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, 0, minutes);
  const firstGuess = wallClockAsUtc - utcOffsetAt(new Date(wallClockAsUtc), timeZone);
  return new Date(wallClockAsUtc - utcOffsetAt(new Date(firstGuess), timeZone));
}

/** The calendar date `days` after `date`; negative values go back. */
export function addDays(date: string, days: number): string {
  const { year, month, day } = parseDate(date);
  return toDateString(year, month, day + days);
}

/** The instants at which `date` starts and ends in `timeZone`, as ISO strings. */
export function dayRange(date: string, timeZone: string): { from: string; to: string } {
  return {
    from: instantAt(date, 0, timeZone).toISOString(),
    to: instantAt(addDays(date, 1), 0, timeZone).toISOString(),
  };
}
