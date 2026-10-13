import { useMemo, useState, type JSX, type SyntheticEvent } from 'react';
import { describeError } from '../../lib/api/errorMessages';
import controls from '../../ui/controls.module.css';
import { useCalendars, useCreateCalendar } from '../calendars/hooks/useCalendars';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../tasks/hooks/useTasks';
import { useCreateEvent, useDeleteEvent, useEvents } from '../timeline/hooks/useEvents';
import { isProvisional, provisionalEvent } from '../timeline/provisionalEvent';
import styles from './PlannerDashboard.module.css';

function todayDate(): string {
  return toDateInputValue(new Date());
}

function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDateStart(date: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return new Date();
  }

  const [, year, month, day] = match;
  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(Number(year), Number(month) - 1, Number(day));
}

function dayRange(date: string): { from: string; to: string } {
  const start = localDateStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

function dateTimeInputValue(date: string, hour: number, minute: number): string {
  return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function readFormString(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

export function PlannerDashboard(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const range = useMemo(() => dayRange(selectedDate), [selectedDate]);

  const calendarsQuery = useCalendars();
  const tasksQuery = useTasks();
  const eventsQuery = useEvents(range);
  const createCalendar = useCreateCalendar();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const queries = [calendarsQuery, tasksQuery, eventsQuery];
  const isLoading = queries.some((query) => query.isPending);
  const loadError = queries.find((query) => query.isError)?.error;

  const calendars = calendarsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const defaultCalendarId = calendars[0]?.id ?? '';
  const visibleEvents = useMemo(
    () =>
      (eventsQuery.data ?? [])
        .slice()
        .sort((left, right) =>
          (left.startUtc ?? left.startDate ?? '').localeCompare(
            right.startUtc ?? right.startDate ?? '',
          ),
        ),
    [eventsQuery.data],
  );

  const retryLoading = (): void => {
    for (const query of queries) {
      if (query.isError) void query.refetch();
    }
  };

  const submitCalendar = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    createCalendar.mutate(
      {
        name: readFormString(form, 'name'),
        colorKey: readFormString(form, 'colorKey') || 'blue',
        defaultReminderMinutes: [10],
      },
      {
        onSuccess: () => {
          formElement.reset();
        },
      },
    );
  };

  const submitTask = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    createTask.mutate(
      {
        title: readFormString(form, 'title'),
        dueDate: readFormString(form, 'dueDate') || selectedDate,
        priority: 'medium',
        estimateMinutes: Number(readFormString(form, 'estimateMinutes') || '30'),
      },
      {
        onSuccess: () => {
          formElement.reset();
        },
      },
    );
  };

  const submitBlock = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const input = {
      kind: 'timed',
      calendarId: readFormString(form, 'calendarId') || defaultCalendarId,
      title: readFormString(form, 'title'),
      taskId: readFormString(form, 'taskId') || null,
      startUtc: localInputToIso(readFormString(form, 'start')),
      endUtc: localInputToIso(readFormString(form, 'end')),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
    <div className={styles.plannerGrid}>
      <section className={styles.panel} aria-labelledby="timeline-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={controls.eyebrow}>Plan</p>
            <h2 id="timeline-title">Timeline</h2>
          </div>
          <label className={styles.dateControl}>
            Date
            <input
              name="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) {
                  setSelectedDate(event.target.value);
                }
              }}
            />
          </label>
        </div>

        {loadError && (
          <div className={controls.formError} role="alert">
            <p>{describeError(loadError)}</p>
            <button type="button" className={controls.secondaryAction} onClick={retryLoading}>
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <p role="status" aria-live="polite">
            Loading planner...
          </p>
        ) : (
          <div className={styles.timelineList}>
            {visibleEvents.length === 0 && !loadError && (
              <p className={styles.emptyState}>No blocks on this day yet.</p>
            )}
            {visibleEvents.map((eventBlock) => (
              <div
                className={styles.timelineRow}
                key={eventBlock.id}
                aria-busy={isProvisional(eventBlock)}
              >
                <span className={styles.time}>
                  {eventBlock.startUtc
                    ? new Date(eventBlock.startUtc).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'All day'}
                </span>
                <div>
                  <strong>{eventBlock.title}</strong>
                  <span>
                    {calendars.find((calendar) => calendar.id === eventBlock.calendarId)?.name ??
                      'Calendar'}
                  </span>
                </div>
                <button
                  type="button"
                  className={controls.iconAction}
                  aria-label={`Delete ${eventBlock.title}`}
                  disabled={isProvisional(eventBlock)}
                  onClick={() => {
                    deleteEvent.mutate(eventBlock);
                  }}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        <form className={styles.inlineForm} autoComplete="off" onSubmit={submitBlock}>
          <input name="title" placeholder="Block title" autoComplete="off" required />
          <select
            key={defaultCalendarId}
            name="calendarId"
            aria-label="Calendar"
            required
            defaultValue={defaultCalendarId}
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
            key={`start-${selectedDate}`}
            name="start"
            type="datetime-local"
            aria-label="Block start"
            defaultValue={dateTimeInputValue(selectedDate, 9, 0)}
            required
          />
          <input
            key={`end-${selectedDate}`}
            name="end"
            type="datetime-local"
            aria-label="Block end"
            defaultValue={dateTimeInputValue(selectedDate, 9, 30)}
            required
          />
          <button type="submit" className={controls.primaryAction} disabled={!defaultCalendarId}>
            Add block
          </button>
        </form>
      </section>

      <div className={styles.sideStack}>
        <section className={styles.panel} aria-labelledby="task-title">
          <div className={styles.panelHeader}>
            <div>
              <p className={controls.eyebrow}>Inbox</p>
              <h2 id="task-title">Tasks</h2>
            </div>
            <span>{tasks.length} tasks</span>
          </div>

          <form className={styles.inlineForm} autoComplete="off" onSubmit={submitTask}>
            <input name="title" placeholder="New task" autoComplete="off" required />
            <input
              key={selectedDate}
              name="dueDate"
              type="date"
              aria-label="Task due date"
              defaultValue={selectedDate}
            />
            <input
              name="estimateMinutes"
              type="number"
              min="5"
              max="1440"
              aria-label="Task estimate minutes"
              defaultValue="30"
            />
            <button type="submit" className={controls.primaryAction}>
              Add task
            </button>
          </form>

          <ul className={styles.taskList}>
            {tasks.map((task) => (
              <li key={task.id} data-status={task.status}>
                <input
                  type="checkbox"
                  className={controls.checkboxAction}
                  checked={task.status === 'done'}
                  aria-label={`Mark ${task.title} ${task.status === 'done' ? 'todo' : 'done'}`}
                  onChange={() => {
                    updateTask.mutate({
                      task,
                      changes: { status: task.status === 'done' ? 'todo' : 'done' },
                    });
                  }}
                />
                <span>{task.title}</span>
                <small>{task.estimateMinutes}m</small>
                <button
                  type="button"
                  className={controls.iconAction}
                  aria-label={`Delete ${task.title}`}
                  onClick={() => {
                    deleteTask.mutate(task);
                  }}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel} aria-labelledby="calendar-title">
          <div className={styles.panelHeader}>
            <div>
              <p className={controls.eyebrow}>Calendars</p>
              <h2 id="calendar-title">Sources</h2>
            </div>
            <span>{calendars.length}</span>
          </div>
          <form className={styles.inlineForm} autoComplete="off" onSubmit={submitCalendar}>
            <input name="name" placeholder="Calendar name" autoComplete="off" required />
            <select name="colorKey" aria-label="Calendar color" defaultValue="blue">
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="rose">Rose</option>
            </select>
            <button type="submit" className={controls.primaryAction}>
              Add calendar
            </button>
          </form>
          <div className={styles.calendarList}>
            {calendars.map((calendar) => (
              <span
                className={styles.calendarPill}
                data-color={calendar.colorKey}
                key={calendar.id}
              >
                {calendar.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
