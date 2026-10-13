import type { JSX, SyntheticEvent } from 'react';
import { readField } from '../../../lib/forms';
import controls from '../../../ui/controls.module.css';
import { EmptyState } from '../../../ui/EmptyState';
import { Panel } from '../../../ui/Panel';
import { QueryBoundary } from '../../../ui/QueryBoundary';
import { CALENDAR_COLORS, DEFAULT_CALENDAR_COLOR } from '../calendarColors';
import { useCalendars, useCreateCalendar } from '../hooks/useCalendars';
import styles from './CalendarPanel.module.css';

export function CalendarPanel(): JSX.Element {
  const calendarsQuery = useCalendars();
  const createCalendar = useCreateCalendar();

  const submitCalendar = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    createCalendar.mutate(
      {
        name: readField(form, 'name'),
        colorKey: readField(form, 'colorKey') || DEFAULT_CALENDAR_COLOR,
      },
      {
        onSuccess: () => {
          formElement.reset();
        },
      },
    );
  };

  return (
    <Panel title="Calendars" icon="calendar">
      <form className={styles.form} autoComplete="off" onSubmit={submitCalendar}>
        <input
          name="name"
          aria-label="New calendar"
          placeholder="New calendar"
          maxLength={80}
          required
        />
        <select name="colorKey" aria-label="Colour" defaultValue={DEFAULT_CALENDAR_COLOR}>
          {CALENDAR_COLORS.map(({ key, label }) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={controls.primaryAction}
          disabled={createCalendar.isPending}
        >
          Add calendar
        </button>
      </form>

      <QueryBoundary query={calendarsQuery} loadingLabel="Loading calendars...">
        {(calendars) =>
          calendars.length === 0 ? (
            <EmptyState icon="calendar" title="No calendars yet">
              Every block lives in a calendar, so add one first.
            </EmptyState>
          ) : (
            <ul className={styles.list}>
              {calendars.map((calendar) => (
                <li
                  className={styles.calendar}
                  data-calendar-color={calendar.colorKey}
                  key={calendar.id}
                >
                  {calendar.name}
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </Panel>
  );
}
