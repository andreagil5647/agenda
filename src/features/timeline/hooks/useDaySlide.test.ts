import { act, renderHook } from '@testing-library/react';
import { resetDevice, setDevice } from '../../../../test/helpers/device';
import { useDaySlide } from './useDaySlide';

afterEach(resetDevice);

function slideOf(
  day: string,
): ReturnType<typeof renderHook<ReturnType<typeof useDaySlide>, { day: string }>> {
  return renderHook(({ day: shown }) => useDaySlide(shown), { initialProps: { day } });
}

describe('useDaySlide', () => {
  it('does not slide the first day that is shown', () => {
    const { result } = slideOf('2026-10-14');

    expect(result.current.slide).toBeNull();
  });

  it('slides forward when the day is a later one, and back when it is an earlier one', () => {
    const { result, rerender } = slideOf('2026-10-14');

    rerender({ day: '2026-10-15' });
    expect(result.current.slide).toBe('forward');

    act(() => {
      result.current.slid();
    });
    rerender({ day: '2026-10-13' });
    expect(result.current.slide).toBe('back');
  });

  it('goes by the order of the days, not by how far they are', () => {
    const { result, rerender } = slideOf('2026-10-14');

    rerender({ day: '2026-12-01' });
    expect(result.current.slide).toBe('forward');

    act(() => {
      result.current.slid();
    });
    rerender({ day: '2026-01-02' });
    expect(result.current.slide).toBe('back');
  });

  it('is done once the slide has finished', () => {
    const { result, rerender } = slideOf('2026-10-14');
    rerender({ day: '2026-10-15' });

    act(() => {
      result.current.slid();
    });

    expect(result.current.slide).toBeNull();
  });

  it('does not slide for a reader who asked for less motion', () => {
    setDevice({ reducedMotion: true });
    const { result, rerender } = slideOf('2026-10-14');

    rerender({ day: '2026-10-15' });

    expect(result.current.slide).toBeNull();
  });
});
