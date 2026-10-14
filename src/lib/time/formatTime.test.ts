import {
  formatDayHeading,
  formatDuration,
  formatTimeInputValue,
  formatTimeOfDay,
  formatTimeRange,
  parseTimeOfDay,
} from './formatTime';

/** ICU puts a no-break space before "AM" and inside "a. m."; which kind varies by version. */
function plain(text: string): string {
  return text.replace(/\s/g, ' ');
}

describe('formatTimeOfDay', () => {
  it('writes a 24-hour time with leading zeros, in any language', () => {
    for (const locale of ['en', 'es']) {
      expect(formatTimeOfDay(0, 'h23', locale)).toBe('00:00');
      expect(formatTimeOfDay(9 * 60 + 5, 'h23', locale)).toBe('09:05');
      expect(formatTimeOfDay(23 * 60 + 59, 'h23', locale)).toBe('23:59');
    }
  });

  it('writes a 12-hour time with the period of the language', () => {
    expect(plain(formatTimeOfDay(0, 'h12', 'en'))).toBe('12:00 AM');
    expect(plain(formatTimeOfDay(9 * 60 + 5, 'h12', 'en'))).toBe('9:05 AM');
    expect(plain(formatTimeOfDay(12 * 60, 'h12', 'en'))).toBe('12:00 PM');
    expect(plain(formatTimeOfDay(18 * 60 + 30, 'h12', 'en'))).toBe('6:30 PM');

    expect(plain(formatTimeOfDay(0, 'h12', 'es'))).toBe('12:00 a. m.');
    expect(plain(formatTimeOfDay(18 * 60 + 30, 'h12', 'es'))).toBe('6:30 p. m.');
  });

  it('keeps the regional way of writing the period', () => {
    expect(plain(formatTimeOfDay(9 * 60, 'h12', 'en-GB'))).toBe('9:00 am');
    expect(plain(formatTimeOfDay(9 * 60, 'h12', 'es-MX'))).toBe('9:00 a.m.');
  });

  it('writes the end of the day as midnight', () => {
    expect(formatTimeOfDay(24 * 60, 'h23', 'en')).toBe('00:00');
    expect(plain(formatTimeOfDay(24 * 60, 'h12', 'en'))).toBe('12:00 AM');
  });
});

describe('formatTimeInputValue', () => {
  it('writes the 24-hour value a time input holds, whatever the language', () => {
    expect(formatTimeInputValue(0)).toBe('00:00');
    expect(formatTimeInputValue(9 * 60 + 5)).toBe('09:05');
    expect(formatTimeInputValue(23 * 60 + 59)).toBe('23:59');
  });

  it('writes the end of the day as midnight', () => {
    expect(formatTimeInputValue(24 * 60)).toBe('00:00');
  });

  it('is read back by parseTimeOfDay', () => {
    expect(parseTimeOfDay(formatTimeInputValue(14 * 60 + 45))).toBe(14 * 60 + 45);
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
    expect(formatTimeRange(9 * 60 + 30, 11 * 60, 'h23', 'en')).toBe('09:30 – 11:00');
    expect(plain(formatTimeRange(9 * 60 + 30, 13 * 60, 'h12', 'es'))).toBe(
      '9:30 a. m. – 1:00 p. m.',
    );
  });
});

describe('formatDuration', () => {
  it('uses minutes, hours or both', () => {
    expect(formatDuration(45, 'en')).toBe('45 min');
    expect(formatDuration(60, 'en')).toBe('1 hr');
    expect(formatDuration(90, 'en')).toBe('1 hr 30 min');
  });

  it('uses the units of the language', () => {
    expect(formatDuration(45, 'es')).toBe('45 min');
    expect(formatDuration(60, 'es')).toBe('1 h');
    expect(formatDuration(150, 'es')).toBe('2 h 30 min');
  });
});

describe('formatDayHeading', () => {
  it('writes the weekday, day and month in the given locale', () => {
    expect(formatDayHeading('2026-10-12', 'en-GB')).toBe('Monday 12 October');
    expect(formatDayHeading('2026-10-12', 'es')).toBe('lunes, 12 de octubre');
  });
});
