import { useMemo, type JSX, type SyntheticEvent } from 'react';
import type { PlannerEvent } from '../../../lib/api/contract';
import { readField } from '../../../lib/forms';
import { formatTimeOfDay, parseTimeOfDay, type HourCycle } from '../../../lib/time/formatTime';
import { dayRange, instantAt, minutesOfDay } from '../../../lib/time/zonedTime';
import controls from '../../../ui/controls.module.css';
import { Panel } from '../../../ui/Panel';
import { QueryBoundary } from '../../../ui/QueryBoundary';
import { useCalendars } from '../../calendars/hooks/useCalendars';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useCreateEvent, useDeleteEvent, useEvents } from '../hooks/useEvents';
import { isProvisional, provisionalEvent } from '../provisionalEvent';
import styles from './DayTimeline.module.css';

const DEFAULT_START_MINUTES = 9 * 60;
const DEFAULT_END_MINUTES = 9 * 60 + 30;

interface DayTimelineProps {
  day: string;
  timeZone: string;
  hourCycle: HourCycle;
}

function byStart(left: PlannerEvent, right: PlannerEvent): number {
  return (left.startUtc ?? left.startDate ?? '').localeCompare(
    right.startUtc ?? right.startDate ?? '',
  );
}

export function DayTimeline({ day, timeZone, hourCycle }: DayTimelineProps): JSX.Element {
  const range = useMemo(() => dayRange(day, timeZone), [day, timeZone]);
  const eventsQuery = useEvents(range);
  const calendars = useCalendars().data ?? [];
  const tasks = useTasks().data ?? [];
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const defaultCalendarId = calendars[0]?.id ?? '';

  const startLabel = (event: PlannerEvent): string =>
    event.startUtc
      ? formatTimeOfDay(minutesOfDay(new Date(event.startUtc), timeZone), hourCycle)
      : 'All day';

  const submitBlock = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const start = parseTimeOfDay(readField(form, 'start')) ?? DEFAULT_START_MINUTES;
    const end = parseTimeOfDay(readField(form, 'end')) ?? DEFAULT_END_MINUTES;
    const input = {
      kind: 'timed',
      calendarId: readField(form, 'calendarId') || defaultCalendarId,
      title: readField(form, 'title'),
      taskId: readField(form, 'taskId') || null,
      startUtc: instantAt(day, start, timeZone).toISOString(),
      endUtc: instantAt(day, end, timeZone).toISOString(),
      timeZone,
    } as const;

    createEvent.mutate(
      { input, provisional: provisionalEvent(input, new Date()) },
      {
        onSuccess: () => {
          formElement.reset();
        },
      },
    );
  };

  return (
    <Panel eyebrow="Plan" title="Timeline">
      <QueryBoundary query={eventsQuery} loadingLabel="Loading the day...">
        {(events) =>
          events.length === 0 ? (
            <p className={styles.empty}>No blocks on this day yet.</p>
          ) : (
            <ul className={styles.list}>
              {events.toSorted(byStart).map((event) => (
                <li className={styles.row} key={event.id} aria-busy={isProvisional(event)}>
                  <span className={styles.time}>{startLabel(event)}</span>
                  <div>
                    <strong>{event.title}</strong>
                    <span>
                      {calendars.find((calendar) => calendar.id === event.calendarId)?.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={controls.iconAction}
                    aria-label={`Delete ${event.title}`}
                    disabled={isProvisional(event)}
                    onClick={() => {
                      deleteEvent.mutate(event);
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>

      <form className={styles.form} autoComplete="off" onSubmit={submitBlock}>
        <input
          name="title"
          aria-label="New block"
          placeholder="New block"
          maxLength={160}
          required
        />
        <select
          key={defaultCalendarId}
          name="calendarId"
          aria-label="Calendar"
          defaultValue={defaultCalendarId}
          required
        >
          {calendars.map((calendar) => (
            <option value={calendar.id} key={calendar.id}>
              {calendar.name}
            </option>
          ))}
        </select>
        <select name="taskId" aria-label="Linked task" defaultValue="">
          <option value="">No linked task</option>
          {tasks.map((task) => (
            <option value={task.id} key={task.id}>
              {task.title}
            </option>
          ))}
        </select>
        <input
          name="start"
          type="time"
          aria-label="Start"
          defaultValue={formatTimeOfDay(DEFAULT_START_MINUTES, 'h23')}
          required
        />
        <input
          name="end"
          type="time"
          aria-label="End"
          defaultValue={formatTimeOfDay(DEFAULT_END_MINUTES, 'h23')}
          required
        />
        <button type="submit" className={controls.primaryAction} disabled={!defaultCalendarId}>
          Add block
        </button>
      </form>
    </Panel>
  );
}
