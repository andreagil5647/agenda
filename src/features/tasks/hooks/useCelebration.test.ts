import { act, renderHook } from '@testing-library/react';
import { useCelebration } from './useCelebration';

function celebrationOf(
  isOpen: boolean,
): ReturnType<typeof renderHook<ReturnType<typeof useCelebration>, { isOpen: boolean }>> {
  return renderHook(({ isOpen: open }) => useCelebration(open), { initialProps: { isOpen } });
}

describe('useCelebration', () => {
  it('does not celebrate a task that is already finished', () => {
    const { result } = celebrationOf(false);

    expect(result.current.isCelebrating).toBe(false);
  });

  it('does not celebrate a task that someone else finished', () => {
    const { result, rerender } = celebrationOf(true);

    rerender({ isOpen: false });

    expect(result.current.isCelebrating).toBe(false);
  });

  it('celebrates once the task the reader finished shows as finished, and not before', () => {
    const { result, rerender } = celebrationOf(true);

    act(() => {
      result.current.start();
    });
    expect(result.current.isCelebrating).toBe(false);

    rerender({ isOpen: false });
    expect(result.current.isCelebrating).toBe(true);
  });

  it('remembers how big the moment was when it started', () => {
    const { result, rerender } = celebrationOf(true);

    act(() => {
      result.current.start('large');
    });
    rerender({ isOpen: false });

    expect(result.current.size).toBe('large');
  });

  it('is a small moment unless it is told otherwise', () => {
    const { result, rerender } = celebrationOf(true);

    act(() => {
      result.current.start();
    });
    rerender({ isOpen: false });

    expect(result.current.size).toBe('small');
  });

  it('stops when it is over', () => {
    const { result, rerender } = celebrationOf(true);
    act(() => {
      result.current.start();
    });
    rerender({ isOpen: false });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isCelebrating).toBe(false);
  });

  it('stops when the task is open again, so a refused change leaves nothing waiting', () => {
    const { result, rerender } = celebrationOf(true);
    act(() => {
      result.current.start();
    });
    rerender({ isOpen: false });
    expect(result.current.isCelebrating).toBe(true);

    rerender({ isOpen: true });
    expect(result.current.isCelebrating).toBe(false);

    // Finished again, but not by the reader this time.
    rerender({ isOpen: false });
    expect(result.current.isCelebrating).toBe(false);
  });
});
