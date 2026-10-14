import type { JSX, SyntheticEvent } from 'react';
import { readField } from '../../../lib/forms';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import controls from '../../../ui/controls.module.css';
import { EmptyState } from '../../../ui/EmptyState';
import { Panel } from '../../../ui/Panel';
import { QueryBoundary } from '../../../ui/QueryBoundary';
import { CALENDAR_COLORS, DEFAULT_CALENDAR_COLOR } from '../calendarColors';
import { useCalendars, useCreateCalendar } from '../hooks/useCalendars';
import styles from './CalendarPanel.module.css';

export function CalendarPanel(): JSX.Element {
  const { t } = useI18n();
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
    <Panel title={t('calendars.title')} icon="calendar">
      <form className={styles.form} autoComplete="off" onSubmit={submitCalendar}>
        <input
          name="name"
          aria-label={t('calendars.new')}
          placeholder={t('calendars.new')}
          maxLength={80}
          required
        />
        <select
          name="colorKey"
          aria-label={t('calendars.color')}
          defaultValue={DEFAULT_CALENDAR_COLOR}
        >
          {CALENDAR_COLORS.map(({ key, label }) => (
            <option value={key} key={key}>
              {t(label)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={controls.primaryAction}
          disabled={createCalendar.isPending}
        >
          {t('calendars.add')}
        </button>
      </form>

      <QueryBoundary query={calendarsQuery} loadingLabel={t('calendars.loading')}>
        {(calendars) =>
          calendars.length === 0 ? (
            <EmptyState icon="calendar" title={t('calendars.empty.title')}>
              {t('calendars.empty.hint')}
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
