import type { JSX } from 'react';
import { formatDayHeading } from '../../../lib/time/formatTime';
import controls from '../../../ui/controls.module.css';
import { Icon } from '../../../ui/Icon';
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
      <div className={styles.title}>
        <h1 className={styles.heading}>{formatDayHeading(day, locale)}</h1>
        {isToday && <p className={styles.today}>Today</p>}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={`${controls.iconAction} ${controls.navAction}`}
          aria-label="Previous day"
          onClick={onShowPrevious}
        >
          <Icon name="chevron-left" />
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
          className={`${controls.iconAction} ${controls.navAction}`}
          aria-label="Next day"
          onClick={onShowNext}
        >
          <Icon name="chevron-right" />
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
