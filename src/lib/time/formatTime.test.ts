import {
  formatDayHeading,
  formatDuration,
  formatTimeOfDay,
  formatTimeRange,
  parseTimeOfDay,
} from './formatTime';

describe('formatTimeOfDay', () => {
  it('writes a 24-hour time with leading zeros', () => {
    expect(formatTimeOfDay(0, 'h23')).toBe('00:00');
    expect(formatTimeOfDay(9 * 60 + 5, 'h23')).toBe('09:05');
    expect(formatTimeOfDay(23 * 60 + 59, 'h23')).toBe('23:59');
  });

  it('writes a 12-hour time with its period', () => {
    expect(formatTimeOfDay(0, 'h12')).toBe('12:00 AM');
    expect(formatTimeOfDay(9 * 60 + 5, 'h12')).toBe('9:05 AM');
    expect(formatTimeOfDay(12 * 60, 'h12')).toBe('12:00 PM');
    expect(formatTimeOfDay(18 * 60 + 30, 'h12')).toBe('6:30 PM');
  });

  it('writes the end of the day as midnight', () => {
    expect(formatTimeOfDay(24 * 60, 'h23')).toBe('00:00');
    expect(formatTimeOfDay(24 * 60, 'h12')).toBe('12:00 AM');
  });
});

describe('parseTimeOfDay', () => {
  it('reads the value of a time input', () => {
    expect(parseTimeOfDay('00:00')).toBe(0);
    expect(parseTimeOfDay('09:30')).toBe(570);
    expect(parseTimeOfDay('23:59')).toBe(1439);
  });

  it('rejects anything that is not a time of day', () => {
    expect(parseTimeOfDay('')).toBeNull();
    expect(parseTimeOfDay('9:30')).toBeNull();
    expect(parseTimeOfDay('24:00')).toBeNull();
    expect(parseTimeOfDay('12:60')).toBeNull();
  });
});

describe('formatTimeRange', () => {
  it('joins two times', () => {
    expect(formatTimeRange(9 * 60 + 30, 11 * 60, 'h23')).toBe('09:30 – 11:00');
  });
});

describe('formatDuration', () => {
  it('uses minutes, hours or both', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
  });
});

describe('formatDayHeading', () => {
  it('writes the weekday, day and month in the given locale', () => {
    expect(formatDayHeading('2026-10-12', 'en-GB')).toBe('Monday 12 October');
    expect(formatDayHeading('2026-10-12', 'es')).toBe('lunes, 12 de octubre');
  });
});
