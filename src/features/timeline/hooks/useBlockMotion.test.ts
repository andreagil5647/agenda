import { act, renderHook } from '@testing-library/react';
import { resetDevice, setDevice } from '../../../../test/helpers/device';
import { buildTimedEvent } from '../../../../test/msw/fakeApi';
import type { PlacedBlock } from '../dayLayout';
import { blockKey } from '../provisionalEvent';
import { useBlockMotion } from './useBlockMotion';

function placed(title: string): PlacedBlock {
  return {
    event: buildTimedEvent({ title }),
    startMinutes: 540,
    endMinutes: 570,
    column: 0,
    columns: 1,
    isClipped: false,
  };
}

afterEach(resetDevice);

describe('useBlockMotion', () => {
  it('starts with nothing arriving and nothing leaving', () => {
    const { result } = renderHook(() => useBlockMotion());

    expect(result.current.arrivals.size).toBe(0);
    expect(result.current.leaving).toEqual([]);
  });

  it('has a block arrive, in the way it was asked to, until it has arrived', () => {
    const { result } = renderHook(() => useBlockMotion());

    act(() => {
      result.current.arrive('block-1', 'settle');
      result.current.arrive('block-2', 'grow');
    });
    expect(result.current.arrivals.get('block-1')).toBe('settle');
    expect(result.current.arrivals.get('block-2')).toBe('grow');

    act(() => {
      result.current.arrived('block-1');
    });
    expect(result.current.arrivals.has('block-1')).toBe(false);
    expect(result.current.arrivals.get('block-2')).toBe('grow');
  });

  it('keeps a deleted block on screen until it has left', () => {
    const { result } = renderHook(() => useBlockMotion());
    const block = placed('Stand-up');

    act(() => {
      result.current.leave(block);
    });
    expect(result.current.leaving).toEqual([block]);

    act(() => {
      result.current.left(blockKey(block.event));
    });
    expect(result.current.leaving).toEqual([]);
  });

  it('does not show the same block leaving twice', () => {
    const { result } = renderHook(() => useBlockMotion());
    const block = placed('Stand-up');

    act(() => {
      result.current.leave(block);
      result.current.leave(block);
    });

    expect(result.current.leaving).toHaveLength(1);
  });

  it('keeps nothing for a reader who asked for less motion', () => {
    setDevice({ reducedMotion: true });
    const { result } = renderHook(() => useBlockMotion());

    act(() => {
      result.current.arrive('block-1', 'settle');
      result.current.leave(placed('Stand-up'));
    });

    expect(result.current.arrivals.size).toBe(0);
    expect(result.current.leaving).toEqual([]);
  });
});
