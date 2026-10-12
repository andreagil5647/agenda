import { addDays, dayRange, instantAt, localDateOf, minutesOfDay } from './zonedTime';

const NINE_AM = 9 * 60;
const at = (iso: string): Date => new Date(iso);

describe('localDateOf', () => {
  it('is the UTC date in UTC', () => {
    expect(localDateOf(at('2026-10-12T23:59:00.000Z'), 'UTC')).toBe('2026-10-12');
  });

  it('is already the next date east of UTC late in the evening', () => {
    expect(localDateOf(at('2026-10-11T22:00:00.000Z'), 'Europe/Madrid')).toBe('2026-10-12');
  });

  it('is still the previous date west of UTC early in the morning', () => {
    expect(localDateOf(at('2026-10-12T02:00:00.000Z'), 'America/New_York')).toBe('2026-10-11');
  });
});

describe('minutesOfDay', () => {
  it('reads the wall clock of the zone, not of UTC', () => {
    expect(minutesOfDay(at('2026-10-12T07:30:00.000Z'), 'Europe/Madrid')).toBe(9 * 60 + 30);
    expect(minutesOfDay(at('2026-10-12T07:30:00.000Z'), 'America/New_York')).toBe(3 * 60 + 30);
  });

  it('is zero at local midnight', () => {
    expect(minutesOfDay(at('2026-10-11T22:00:00.000Z'), 'Europe/Madrid')).toBe(0);
  });

  it('handles half-hour offsets', () => {
    expect(minutesOfDay(at('2026-10-12T03:30:00.000Z'), 'Asia/Kolkata')).toBe(NINE_AM);
  });
});

describe('instantAt', () => {
  it('uses the summer and the winter offset of the zone', () => {
    expect(instantAt('2026-07-01', NINE_AM, 'Europe/Madrid').toISOString()).toBe(
      '2026-07-01T07:00:00.000Z',
    );
    expect(instantAt('2026-12-01', NINE_AM, 'Europe/Madrid').toISOString()).toBe(
      '2026-12-01T08:00:00.000Z',
    );
  });

  it('is later in UTC for a zone west of it', () => {
    expect(instantAt('2026-10-12', NINE_AM, 'America/New_York').toISOString()).toBe(
      '2026-10-12T13:00:00.000Z',
    );
  });

  it('uses the offset in force on each side of an autumn change', () => {
    // Madrid goes from UTC+2 to UTC+1 at 03:00 local on 2026-10-25.
    expect(instantAt('2026-10-25', 60, 'Europe/Madrid').toISOString()).toBe(
      '2026-10-24T23:00:00.000Z',
    );
    expect(instantAt('2026-10-25', 4 * 60, 'Europe/Madrid').toISOString()).toBe(
      '2026-10-25T03:00:00.000Z',
    );
  });

  it('resolves a wall time skipped by a spring change to the time after the gap', () => {
    // 02:30 does not exist in Madrid on 2026-03-29.
    expect(instantAt('2026-03-29', 150, 'Europe/Madrid').toISOString()).toBe(
      '2026-03-29T01:30:00.000Z',
    );
  });

  it('round-trips with localDateOf and minutesOfDay', () => {
    for (const timeZone of ['UTC', 'Europe/Madrid', 'America/Los_Angeles', 'Asia/Kathmandu']) {
      const instant = instantAt('2026-10-12', 14 * 60 + 45, timeZone);

      expect(localDateOf(instant, timeZone)).toBe('2026-10-12');
      expect(minutesOfDay(instant, timeZone)).toBe(14 * 60 + 45);
    }
  });
});

describe('addDays', () => {
  it('crosses months and years', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('dayRange', () => {
  it('spans 24 hours on an ordinary day', () => {
    expect(dayRange('2026-10-12', 'Europe/Madrid')).toEqual({
      from: '2026-10-11T22:00:00.000Z',
      to: '2026-10-12T22:00:00.000Z',
    });
  });

  it('spans 25 hours on the day the clocks go back', () => {
    expect(dayRange('2026-10-25', 'Europe/Madrid')).toEqual({
      from: '2026-10-24T22:00:00.000Z',
      to: '2026-10-25T23:00:00.000Z',
    });
  });

  it('spans 23 hours on the day the clocks go forward', () => {
    expect(dayRange('2026-03-29', 'Europe/Madrid')).toEqual({
      from: '2026-03-28T23:00:00.000Z',
      to: '2026-03-29T22:00:00.000Z',
    });
  });
});
