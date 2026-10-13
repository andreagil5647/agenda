import { useId, type JSX, type ReactNode } from 'react';
import controls from './controls.module.css';
import styles from './Panel.module.css';

interface PanelProps {
  /** A short label above the title that says what kind of thing the panel holds. */
  eyebrow: string;
  title: string;
  /** Shown opposite the title: a count, or the controls for the whole panel. */
  aside?: ReactNode;
  children: ReactNode;
}

/** A titled region of the planner. The title names the region for assistive technology. */
export function Panel({ eyebrow, title, aside, children }: PanelProps): JSX.Element {
  const titleId = useId();

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div>
          <p className={controls.eyebrow}>{eyebrow}</p>
          <h2 id={titleId}>{title}</h2>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
