import { useState } from 'react';

interface Celebration {
  /** Whether the finished task is being celebrated right now. */
  isCelebrating: boolean;
  /** Called when the reader finishes the task. */
  start: () => void;
  /** Called when the celebration is over. */
  stop: () => void;
}

/**
 * Whether a task is being celebrated. A celebration answers something the
 * reader just did, so it starts only when they finish the task, and never
 * because a finished task showed up: not when the list loads, and not when
 * another device finished it.
 *
 * It ends when it is over, and when the task is open again however that came
 * about. That matters when the change is refused and taken back: the
 * celebration must not stay waiting for the next time the task turns up done.
 */
export function useCelebration(isOpen: boolean): Celebration {
  const [isWanted, setIsWanted] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Adjusted while rendering, which is how React keeps state in step with a prop. Only the task
  // opening ends it: the finished task arrives a moment after the click, so the click is not
  // a reason to end anything.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setIsWanted(false);
    }
  }

  return {
    isCelebrating: isWanted && !isOpen,
    start: () => {
      setIsWanted(true);
    },
    stop: () => {
      setIsWanted(false);
    },
  };
}
