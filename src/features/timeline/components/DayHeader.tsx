import type { JSX } from 'react';
import { formatDayHeading } from '../../../lib/time/formatTime';
import controls from '../../../ui/controls.module.css';
import styles from './DayHeader.module.css';

interface DayHeaderProps {
  day: string;
  isToday: boolean;
  locale: string;
  onShowDay: (day: string) => void;
  onShowToday: () => void;
  onShowPrevious: () => void;
  onShowNext: () => void;
}

/** Names the day on screen and moves between days. */
export function DayHeader({
  day,
  isToday,
  locale,
  onShowDay,
  onShowToday,
  onShowPrevious,
  onShowNext,
}: DayHeaderProps): JSX.Element {
  return (
    <header className={styles.header}>
      <div>
        <p className={controls.eyebrow}>{isToday ? 'Today' : 'Day'}</p>
        <h1 className={styles.heading}>{formatDayHeading(day, locale)}</h1>
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={controls.iconAction}
          aria-label="Previous day"
          onClick={onShowPrevious}
        >
          ‹
        </button>
        <button
          type="button"
          className={controls.secondaryAction}
          disabled={isToday}
          onClick={onShowToday}
        >
          Today
        </button>
        <button
          type="button"
          className={controls.iconAction}
          aria-label="Next day"
          onClick={onShowNext}
        >
          ›
        </button>
        <input
          type="date"
          className={styles.datePicker}
          aria-label="Go to date"
          value={day}
          onChange={(event) => {
            if (event.target.value) onShowDay(event.target.value);
          }}
        />
      </div>
    </header>
  );
}
