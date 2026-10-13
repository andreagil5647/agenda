import type { JSX } from 'react';
import styles from './AuthPreview.module.css';

/**
 * A small, made-up day that shows what the planner looks like. It is
 * decoration, so assistive technology skips it; the text beside it says the same.
 */
export function AuthPreview(): JSX.Element {
  return (
    <div className={styles.preview} aria-hidden="true">
      <p className={styles.day}>Monday</p>
      <ul className={styles.blocks}>
        <li data-calendar-color="blue" style={{ '--row': 1, '--span': 1 }}>
          <strong>Stand-up</strong> 09:00
        </li>
        <li data-calendar-color="green" style={{ '--row': 2, '--span': 2 }}>
          <strong>Draft the launch checklist</strong> 09:30
        </li>
        <li data-calendar-color="peach" style={{ '--row': 5, '--span': 1 }}>
          <strong>Lunch with Marta</strong> 13:00
        </li>
      </ul>
      <p className={styles.task}>Write release notes</p>
    </div>
  );
}
