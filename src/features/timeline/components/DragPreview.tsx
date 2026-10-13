import type { JSX } from 'react';
import { formatDuration } from '../../../lib/time/formatTime';
import { draggedMinutes, draggedTitle, type DraggedItem } from '../planningDrag';
import styles from './DragPreview.module.css';

/** What follows the pointer during a drag: the block as it will be on the grid, to scale. */
export function DragPreview({ item }: { item: DraggedItem }): JSX.Element {
  const minutes = draggedMinutes(item);

  return (
    <div className={styles.preview} style={{ '--duration': minutes }}>
      <strong>{draggedTitle(item)}</strong>
      <span>{formatDuration(minutes)}</span>
    </div>
  );
}
