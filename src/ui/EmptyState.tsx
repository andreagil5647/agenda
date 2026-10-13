import type { JSX, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  /** What to do next: an empty list should always say how to start filling it. */
  children: ReactNode;
}

/** What a list or a day shows when there is nothing in it yet. */
export function EmptyState({ icon, title, children }: EmptyStateProps): JSX.Element {
  return (
    <div className={styles.empty}>
      <span className={styles.badge}>
        <Icon name={icon} />
      </span>
      <p className={styles.title}>{title}</p>
      <p className={styles.hint}>{children}</p>
    </div>
  );
}
