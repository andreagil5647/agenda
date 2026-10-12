/** How times and dates are written for the user. Pure: the locale and preferences are passed in. */

export type HourCycle = 'h12' | 'h23';

const MINUTES_PER_HALF_DAY = 12 * 60;

/** A time of day such as "09:30" or "9:30 AM", from minutes after midnight. */
export function formatTimeOfDay(minutes: number, hourCycle: HourCycle): string {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = String(minutes % 60).padStart(2, '0');

  if (hourCycle === 'h23') {
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }
  const period = minutes % (24 * 60) < MINUTES_PER_HALF_DAY ? 'AM' : 'PM';
  return `${String(hour % 12 || 12)}:${minute} ${period}`;
}

/** A range of times of day, such as "09:30 – 11:00". */
export function formatTimeRange(start: number, end: number, hourCycle: HourCycle): string {
  return `${formatTimeOfDay(start, hourCycle)} – ${formatTimeOfDay(end, hourCycle)}`;
}

/** A length of time such as "45 min", "1 h" or "1 h 30 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${String(rest)} min`;
  return rest === 0 ? `${String(hours)} h` : `${String(hours)} h ${String(rest)} min`;
}

/** A calendar date written out, such as "Monday, 12 October". */
export function formatDayHeading(date: string, locale: string): string {
  // The date has no zone of its own; formatting it at noon UTC keeps it on the same day.
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00.000Z`));
}
