import type { JSX } from 'react';
import type { Task } from '../../../lib/api/contract';
import { formatDuration } from '../../../lib/time/formatTime';
import styles from './TaskDragPreview.module.css';

/** What follows the pointer while a task is dragged: the block it would become, to scale. */
export function TaskDragPreview({ task }: { task: Task }): JSX.Element {
  return (
    <div className={styles.preview} style={{ '--duration': task.estimateMinutes }}>
      <strong>{task.title}</strong>
      <span>{formatDuration(task.estimateMinutes)}</span>
    </div>
  );
}
