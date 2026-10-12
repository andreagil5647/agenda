import { buildTimedEvent } from '../../../test/msw/fakeApi';
import type { PlannerEvent } from '../../lib/api/contract';
import {
  firstFreeStart,
  layoutDayBlocks,
  minutesAtOffset,
  movedBy,
  resizedBy,
  slotStart,
  snapToGrid,
  spanAt,
  toDayBlocks,
  type DayBlock,
} from './dayLayout';

const at = (hours: number, minutes = 0): number => hours * 60 + minutes;

function block(id: string, startMinutes: number, endMinutes: number): DayBlock {
  return { event: buildTimedEvent({ id }), startMinutes, endMinutes };
}

function columnsById(blocks: DayBlock[]): Record<string, string> {
  return Object.fromEntries(
    layoutDayBlocks(blocks).map(({ event, column, columns }) => [
      event.id,
      `${String(column + 1)}/${String(columns)}`,
    ]),
  );
}

describe('toDayBlocks', () => {
  const timed = (startUtc: string, endUtc: string): PlannerEvent =>
    buildTimedEvent({ startUtc, endUtc });

  it("places an event by the wall clock of the account's time zone", () => {
    const [placed] = toDayBlocks(
      [timed('2026-10-12T07:00:00.000Z', '2026-10-12T08:30:00.000Z')],
      '2026-10-12',
      'Europe/Madrid',
    );

    expect(placed).toMatchObject({ startMinutes: at(9), endMinutes: at(10, 30) });
  });

  it('leaves out events on other days and all-day events', () => {
    const events = [
      timed('2026-10-11T09:00:00.000Z', '2026-10-11T10:00:00.000Z'),
      timed('2026-10-13T09:00:00.000Z', '2026-10-13T10:00:00.000Z'),
      buildTimedEvent({
        kind: 'allDay',
        startUtc: null,
        endUtc: null,
        startDate: '2026-10-12',
        endDate: '2026-10-13',
      }),
    ];

    expect(toDayBlocks(events, '2026-10-12', 'UTC')).toEqual([]);
  });

  it('cuts an event that crosses midnight at the edge of the day', () => {
    const overnight = timed('2026-10-12T22:00:00.000Z', '2026-10-13T02:00:00.000Z');

    expect(toDayBlocks([overnight], '2026-10-12', 'UTC')[0]).toMatchObject({
      startMinutes: at(22),
      endMinutes: at(24),
    });
    expect(toDayBlocks([overnight], '2026-10-13', 'UTC')[0]).toMatchObject({
      startMinutes: 0,
      endMinutes: at(2),
    });
  });

  it('treats an event ending exactly at midnight as part of the day it started on only', () => {
    const untilMidnight = timed('2026-10-12T23:00:00.000Z', '2026-10-13T00:00:00.000Z');

    expect(toDayBlocks([untilMidnight], '2026-10-12', 'UTC')).toHaveLength(1);
    expect(toDayBlocks([untilMidnight], '2026-10-13', 'UTC')).toHaveLength(0);
  });
});

describe('layoutDayBlocks', () => {
  it('gives the full width to blocks that overlap nothing', () => {
    expect(columnsById([block('a', at(9), at(10)), block('b', at(11), at(12))])).toEqual({
      a: '1/1',
      b: '1/1',
    });
  });

  it('does not count blocks that only touch as overlapping', () => {
    expect(columnsById([block('a', at(9), at(10)), block('b', at(10), at(11))])).toEqual({
      a: '1/1',
      b: '1/1',
    });
  });

  it('puts two overlapping blocks side by side', () => {
    expect(columnsById([block('a', at(15), at(16)), block('b', at(15, 30), at(16, 30))])).toEqual({
      a: '1/2',
      b: '2/2',
    });
  });

  it('reuses a column once the block in it has ended', () => {
    const blocks = [
      block('long', at(9), at(12)),
      block('first', at(9), at(10)),
      block('second', at(10), at(11)),
    ];

    expect(columnsById(blocks)).toEqual({ long: '1/2', first: '2/2', second: '2/2' });
  });

  it('sizes every block of a cluster by its widest point', () => {
    const blocks = [
      block('a', at(9), at(11)),
      block('b', at(9, 30), at(10)),
      block('c', at(9, 30), at(10)),
      block('d', at(10, 30), at(11, 30)),
    ];

    expect(columnsById(blocks)).toEqual({ a: '1/3', b: '2/3', c: '3/3', d: '2/3' });
  });

  it('starts a new cluster after a gap', () => {
    const blocks = [
      block('a', at(9), at(10)),
      block('b', at(9), at(10)),
      block('c', at(14), at(15)),
    ];

    expect(columnsById(blocks)).toEqual({ a: '1/2', b: '2/2', c: '1/1' });
  });

  it('does not depend on the order the blocks arrive in', () => {
    const blocks = [block('b', at(15, 30), at(16, 30)), block('a', at(15), at(16))];

    expect(columnsById(blocks)).toEqual(columnsById(blocks.toReversed()));
  });

  it('returns nothing for an empty day', () => {
    expect(layoutDayBlocks([])).toEqual([]);
  });
});

describe('snapToGrid', () => {
  it('rounds to the nearest quarter of an hour', () => {
    expect(snapToGrid(at(9, 7))).toBe(at(9));
    expect(snapToGrid(at(9, 8))).toBe(at(9, 15));
    expect(snapToGrid(at(9, 52))).toBe(at(9, 45));
  });
});

describe('slotStart', () => {
  it('answers the step a time falls in, never the next one', () => {
    expect(slotStart(at(9))).toBe(at(9));
    expect(slotStart(at(9, 14))).toBe(at(9));
    expect(slotStart(at(9, 15))).toBe(at(9, 15));
  });
});

describe('spanAt', () => {
  it('snaps the start and keeps the length', () => {
    expect(spanAt(at(9, 10), 45)).toEqual({ startMinutes: at(9, 15), endMinutes: at(10) });
  });

  it('keeps the whole span inside the day', () => {
    expect(spanAt(-30, 60)).toEqual({ startMinutes: 0, endMinutes: 60 });
    expect(spanAt(at(23, 45), 60)).toEqual({ startMinutes: at(23), endMinutes: at(24) });
  });
});

describe('movedBy', () => {
  const span = { startMinutes: at(9), endMinutes: at(10) };

  it('moves both ends by the same amount', () => {
    expect(movedBy(span, 90)).toEqual({ startMinutes: at(10, 30), endMinutes: at(11, 30) });
    expect(movedBy(span, -15)).toEqual({ startMinutes: at(8, 45), endMinutes: at(9, 45) });
  });

  it('snaps a move that is not a whole step', () => {
    expect(movedBy(span, 20)).toEqual({ startMinutes: at(9, 15), endMinutes: at(10, 15) });
  });

  it('stops at the start and at the end of the day', () => {
    expect(movedBy(span, -24 * 60)).toEqual({ startMinutes: 0, endMinutes: 60 });
    expect(movedBy(span, 24 * 60)).toEqual({ startMinutes: at(23), endMinutes: at(24) });
  });
});

describe('resizedBy', () => {
  const span = { startMinutes: at(9), endMinutes: at(10) };

  it('moves the end only', () => {
    expect(resizedBy(span, 30)).toEqual({ startMinutes: at(9), endMinutes: at(10, 30) });
    expect(resizedBy(span, -30)).toEqual({ startMinutes: at(9), endMinutes: at(9, 30) });
  });

  it('never makes the span shorter than one step', () => {
    expect(resizedBy(span, -120)).toEqual({ startMinutes: at(9), endMinutes: at(9, 15) });
  });

  it('never runs past the end of the day', () => {
    expect(resizedBy(span, 24 * 60).endMinutes).toBe(at(24));
  });
});

describe('firstFreeStart', () => {
  const taken = [
    { startMinutes: at(9), endMinutes: at(10) },
    { startMinutes: at(10), endMinutes: at(11) },
    { startMinutes: at(11, 30), endMinutes: at(12) },
  ];

  it('starts where asked when that time is free', () => {
    expect(firstFreeStart(taken, 60, at(7))).toBe(at(7));
  });

  it('rounds the asked time up to the grid', () => {
    expect(firstFreeStart([], 30, at(7, 5))).toBe(at(7, 15));
  });

  it('skips past blocks that are in the way', () => {
    expect(firstFreeStart(taken, 30, at(9))).toBe(at(11));
  });

  it('skips a gap that is too short', () => {
    expect(firstFreeStart(taken, 60, at(9))).toBe(at(12));
  });

  it('answers null when nothing fits before midnight', () => {
    expect(firstFreeStart([{ startMinutes: at(9), endMinutes: at(24) }], 30, at(9))).toBeNull();
  });
});

describe('minutesAtOffset', () => {
  it('maps a position in the column to a time of day', () => {
    expect(minutesAtOffset(0, 1440)).toBe(0);
    expect(minutesAtOffset(720, 1440)).toBe(at(12));
    expect(minutesAtOffset(336, 1344)).toBe(at(6));
  });

  it('answers midnight for a column that has no height yet', () => {
    expect(minutesAtOffset(100, 0)).toBe(0);
  });
});
