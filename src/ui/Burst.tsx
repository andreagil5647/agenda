import type { JSX } from 'react';
import styles from './Burst.module.css';

const MARKS = { small: 6, large: 12 } as const;
const TONES = 3;

export type BurstSize = keyof typeof MARKS;

/**
 * A short burst of marks flying out from the middle of whatever it is placed in, which has to be
 * positioned. It plays once when it appears and calls `onEnd` when it has finished, for its owner
 * to take it away. A large one has more marks that go further, for a bigger moment. What the
 * marks are, how big and how far they go, comes from the theme's burst tokens. Decoration only:
 * it is hidden from assistive technology, and not shown at all to a reader who asked for less
 * motion.
 */
export function Burst({
  onEnd,
  size = 'small',
}: {
  onEnd: () => void;
  size?: BurstSize;
}): JSX.Element {
  const count = MARKS[size];

  return (
    <span
      className={styles.burst}
      data-burst
      data-size={size}
      aria-hidden="true"
      onAnimationEnd={onEnd}
    >
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          className={styles.mark}
          data-tone={index % TONES}
          style={{ '--angle': `${String((index * 360) / count)}deg` }}
        />
      ))}
    </span>
  );
}
