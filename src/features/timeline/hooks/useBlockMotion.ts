import { useCallback, useMemo, useState } from 'react';
import { prefersReducedMotion } from '../../../lib/motion/reducedMotion';
import type { PlacedBlock } from '../dayLayout';
import { blockKey } from '../provisionalEvent';

/** How a block that has just come to the grid appears. */
export type Arrival =
  /** It was dropped there: it lands with a small bounce. */
  | 'settle'
  /** It was made there, by a click or a button: it grows from its top edge. */
  | 'grow';

export interface BlockMotion {
  /** The blocks that have just arrived, by block key, and how. */
  arrivals: ReadonlyMap<string, Arrival>;
  /** The blocks the reader has just deleted, kept on screen while they leave. */
  leaving: readonly PlacedBlock[];
  arrive: (key: string, how: Arrival) => void;
  /** Called when a block has finished arriving. */
  arrived: (key: string) => void;
  leave: (block: PlacedBlock) => void;
  /** Called when a block has finished leaving. */
  left: (key: string) => void;
}

/**
 * What the day grid is doing to its blocks because the reader did something: a block that was
 * dropped or made arrives, and one that was deleted takes a moment to leave. Nothing here is
 * about a block that merely turned up, such as one on a day that was just loaded or one that
 * changed elsewhere: only the reader's own actions say "arrive" or "leave".
 *
 * Nothing is kept for a reader who asked for less motion, so nothing can be left behind waiting
 * for an animation that never plays.
 */
export function useBlockMotion(): BlockMotion {
  const [arrivals, setArrivals] = useState<ReadonlyMap<string, Arrival>>(new Map());
  const [leaving, setLeaving] = useState<readonly PlacedBlock[]>([]);

  const arrive = useCallback((key: string, how: Arrival): void => {
    if (prefersReducedMotion()) return;
    setArrivals((current) => new Map(current).set(key, how));
  }, []);

  const arrived = useCallback((key: string): void => {
    setArrivals((current) => {
      if (!current.has(key)) return current;
      const next = new Map(current);
      next.delete(key);
      return next;
    });
  }, []);

  const leave = useCallback((block: PlacedBlock): void => {
    if (prefersReducedMotion()) return;
    setLeaving((current) => [
      ...current.filter((other) => blockKey(other.event) !== blockKey(block.event)),
      block,
    ]);
  }, []);

  const left = useCallback((key: string): void => {
    setLeaving((current) => current.filter((block) => blockKey(block.event) !== key));
  }, []);

  return useMemo(
    () => ({ arrivals, leaving, arrive, arrived, leave, left }),
    [arrivals, leaving, arrive, arrived, leave, left],
  );
}
