import type { JSX } from 'react';
import type { Calendar, PlannerEvent } from '../../../lib/api/contract';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import styles from './AllDayRow.module.css';

interface AllDayRowProps {
  events: PlannerEvent[];
  calendars: Calendar[];
  selectedEventId: string | null;
  onSelectEvent: (event: PlannerEvent) => void;
}

/** The events that take the whole day, kept above the hours so they never hide a block. */
export function AllDayRow({
  events,
  calendars,
  selectedEventId,
  onSelectEvent,
}: AllDayRowProps): JSX.Element | null {
  const { t } = useI18n();

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={styles.row}>
      <span className={styles.label} id="all-day-label">
        {t('timeline.allDay')}
      </span>
      <ul className={styles.events} aria-labelledby="all-day-label">
        {events.map((event) => (
          <li
            key={event.id}
            data-calendar-color={
              calendars.find((calendar) => calendar.id === event.calendarId)?.colorKey
            }
          >
            <button
              type="button"
              className={styles.event}
              aria-pressed={event.id === selectedEventId}
              onClick={() => {
                onSelectEvent(event);
              }}
            >
              {event.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
