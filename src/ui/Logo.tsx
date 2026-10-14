import type { JSX } from 'react';
import styles from './Logo.module.css';

/**
 * The brand mark: a calendar page with a small smile. The name next to it, not
 * the drawing, is what assistive technology reads, so the mark is hidden from it.
 */
export function Logo({ size = 40 }: { size?: number }): JSX.Element {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect className={styles.tile} width="40" height="40" rx="12" />
      <rect className={styles.page} x="8" y="10" width="24" height="22" rx="6" />
      <path className={styles.rings} d="M14 7.5v5M26 7.5v5" />
      <circle className={styles.face} cx="15.5" cy="20.5" r="1.7" />
      <circle className={styles.face} cx="24.5" cy="20.5" r="1.7" />
      <path className={styles.smile} d="M15.5 25.5c2.5 3 6.5 3 9 0" />
    </svg>
  );
}
