import { useState } from 'react';
import type { BurstSize } from '../../../ui/Burst';

interface Celebration {
  /** Whether what was finished is being celebrated right now. */
  isCelebrating: boolean;
  /** How big the moment is, from the moment it was started. */
  size: BurstSize;
  /** Called when the reader finishes it, saying how big the moment is. */
  start: (size?: BurstSize) => void;
  /** Called when the celebration is over. */
  stop: () => void;
}

/**
 * Whether something is being celebrated: a task, or the whole list when the last task is done.
 * A celebration answers something the reader just did, so it starts only when they finish it,
 * and never because a finished thing showed up: not when the list loads, and not when another
 * device finished it.
 *
 * It ends when it is over, and when the thing is open again however that came about. That
 * matters when the change is refused and taken back: the celebration must not stay waiting for
 * the next time it turns up done.
 */
export function useCelebration(isOpen: boolean): Celebration {
  const [wanted, setWanted] = useState<BurstSize | null>(null);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Adjusted while rendering, which is how React keeps state in step with a prop. Only it
  // opening ends it: the finished thing arrives a moment after the click, so the click is not
  // a reason to end anything.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setWanted(null);
    }
  }

  return {
    isCelebrating: wanted !== null && !isOpen,
    size: wanted ?? 'small',
    start: (size = 'small') => {
      setWanted(size);
    },
    stop: () => {
      setWanted(null);
    },
  };
}
