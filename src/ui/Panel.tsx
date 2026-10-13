import { useId, type JSX, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Panel.module.css';

interface PanelProps {
  title: string;
  /** The drawing in the round badge before the title. */
  icon: IconName;
  /** Shown opposite the title: a count, or the controls for the whole panel. */
  aside?: ReactNode;
  children: ReactNode;
}

/** A titled region of the planner. The title names the region for assistive technology. */
export function Panel({ title, icon, aside, children }: PanelProps): JSX.Element {
  const titleId = useId();

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.badge}>
            <Icon name={icon} />
          </span>
          <h2 id={titleId}>{title}</h2>
        </div>
        {aside && <div className={styles.aside}>{aside}</div>}
      </header>
      {children}
    </section>
  );
}
