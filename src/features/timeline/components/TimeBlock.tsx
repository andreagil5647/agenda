import type { JSX } from 'react';
import type { Calendar, PlannerEvent } from '../../../lib/api/contract';
import { formatTimeRange, type HourCycle } from '../../../lib/time/formatTime';
import controls from '../../../ui/controls.module.css';
import type { PlacedBlock } from '../dayLayout';
import { isProvisional } from '../provisionalEvent';
import styles from './TimeBlock.module.css';

/** Below this length a block has room for one line only. */
const SHORT_BLOCK_MINUTES = 45;

interface TimeBlockProps {
  block: PlacedBlock;
  calendar: Calendar | undefined;
  hourCycle: HourCycle;
  isSelected: boolean;
  onSelect: (event: PlannerEvent) => void;
}

/** One block on the day grid, placed by its times and by its column among overlapping blocks. */
export function TimeBlock({
  block,
  calendar,
  hourCycle,
  isSelected,
  onSelect,
}: TimeBlockProps): JSX.Element {
  const { event, startMinutes, endMinutes, column, columns } = block;
  const timeRange = formatTimeRange(startMinutes, endMinutes, hourCycle);
  const isSaving = isProvisional(event);

  return (
    <li
      className={styles.block}
      data-calendar-color={calendar?.colorKey}
      data-short={endMinutes - startMinutes < SHORT_BLOCK_MINUTES}
      style={{
        '--start': startMinutes,
        '--end': endMinutes,
        '--column': column,
        '--columns': columns,
      }}
    >
      <button
        type="button"
        className={styles.body}
        aria-pressed={isSelected}
        aria-busy={isSaving}
        disabled={isSaving}
        onClick={() => {
          onSelect(event);
        }}
      >
        <strong className={styles.title}>{event.title}</strong>{' '}
        <span className={styles.time}>{timeRange}</span>
        {/* Part of the block's accessible name, not of its face. */}
        {calendar && <span className={controls.visuallyHidden}>{calendar.name}</span>}
      </button>
    </li>
  );
}
