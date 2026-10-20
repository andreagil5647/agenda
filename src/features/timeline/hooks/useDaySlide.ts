import { useCallback, useState } from 'react';
import { prefersReducedMotion } from '../../../lib/motion/reducedMotion';

/** Which way the day slides in: from the right when the reader went forward, from the left back. */
export type Slide = 'forward' | 'back';

interface DaySlide {
  /** Set from the moment the day changes until the slide has finished. */
  slide: Slide | null;
  /** Called when the slide has finished. */
  slid: () => void;
}

/**
 * The slide that shows the reader the day has changed, and which way it went. The day only
 * changes when the reader changes it, so a change is always theirs; the first day shown does not
 * slide, since nothing has been moved. A reader who asked for less motion gets none.
 *
 * Days are ISO dates, which put earlier days before later ones when compared as text.
 */
export function useDaySlide(day: string): DaySlide {
  const [shown, setShown] = useState<{ day: string; slide: Slide | null }>({ day, slide: null });

  // Adjusted while rendering, which is how React keeps state in step with a prop.
  if (shown.day !== day) {
    const direction: Slide = day > shown.day ? 'forward' : 'back';
    setShown({ day, slide: prefersReducedMotion() ? null : direction });
  }

  const slid = useCallback((): void => {
    setShown((current) => (current.slide ? { ...current, slide: null } : current));
  }, []);

  return { slide: shown.slide, slid };
}
