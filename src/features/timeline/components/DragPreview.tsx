import type { JSX } from 'react';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import { formatDuration } from '../../../lib/time/formatTime';
import { draggedMinutes, draggedTitle, type DraggedItem } from '../planningDrag';
import styles from './DragPreview.module.css';

/** What follows the pointer during a drag: the block as it will be on the grid, to scale. */
export function DragPreview({ item }: { item: DraggedItem }): JSX.Element {
  const { locale } = useI18n();
  const minutes = draggedMinutes(item);

  return (
    <div className={styles.preview} style={{ '--duration': minutes }}>
      <strong>{draggedTitle(item)}</strong>
      <span>{formatDuration(minutes, locale)}</span>
    </div>
  );
}
