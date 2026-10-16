import type { JSX } from 'react';
import styles from './Burst.module.css';

const MARKS = 6;

/**
 * A short burst of marks flying out from the middle of whatever it is placed in,
 * which has to be positioned. It plays once when it appears and calls `onEnd`
 * when it has finished, for its owner to take it away. What the marks are, how
 * big and how far they go, comes from the theme's burst tokens. Decoration only:
 * it is hidden from assistive technology, and not shown at all to a reader who
 * asked for less motion.
 */
export function Burst({ onEnd }: { onEnd: () => void }): JSX.Element {
  return (
    <span className={styles.burst} data-burst aria-hidden="true" onAnimationEnd={onEnd}>
      {Array.from({ length: MARKS }, (_, index) => (
        <i key={index} className={styles.mark} />
      ))}
    </span>
  );
}
