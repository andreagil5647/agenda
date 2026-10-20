import { buildTimedEvent } from '../../../test/msw/fakeApi';
import { blockKey, provisionalEvent, rememberReplacement } from './provisionalEvent';

const INPUT = {
  kind: 'timed',
  calendarId: 'c1',
  title: 'Focus',
  startUtc: '2026-10-14T09:00:00.000Z',
  endUtc: '2026-10-14T09:30:00.000Z',
  timeZone: 'UTC',
} as const;

describe('blockKey', () => {
  it('is the id of an event that was never provisional', () => {
    const event = buildTimedEvent();

    expect(blockKey(event)).toBe(event.id);
  });

  it('stays what it was when the saved event takes the place of a provisional one', () => {
    const provisional = provisionalEvent(INPUT, new Date());
    const saved = buildTimedEvent({ title: 'Focus' });
    const before = blockKey(provisional);

    rememberReplacement(provisional.id, saved);

    expect(blockKey(saved)).toBe(before);
    expect(blockKey(saved)).not.toBe(saved.id);
  });

  it('is different for every block', () => {
    const first = provisionalEvent(INPUT, new Date());
    const second = provisionalEvent(INPUT, new Date());

    expect(blockKey(first)).not.toBe(blockKey(second));
  });
});
