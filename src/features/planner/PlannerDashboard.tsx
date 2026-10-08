import { useCallback, useEffect, useMemo, useState, type JSX, type SyntheticEvent } from 'react';
import { apiClient, ApiError } from '../../lib/api/apiClient';
import type { Calendar, EventBlock, Task } from '../../lib/api/types';
import { useAuth } from '../../lib/auth/AuthContext';

interface PlannerState {
  calendars: Calendar[];
  tasks: Task[];
  events: EventBlock[];
  isLoading: boolean;
  error: string | null;
}

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

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'The planner could not sync. Try again in a moment.';
}

function readFormString(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

export function PlannerDashboard(): JSX.Element {
  const { session } = useAuth();
  const csrfToken = session?.csrfToken ?? '';
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [state, setState] = useState<PlannerState>({
    calendars: [],
    tasks: [],
    events: [],
    isLoading: true,
    error: null,
  });

  const defaultCalendarId = state.calendars[0]?.id ?? '';
  const visibleEvents = useMemo(
    () =>
      state.events
        .slice()
        .sort((left, right) =>
          (left.startUtc ?? left.startDate ?? '').localeCompare(
            right.startUtc ?? right.startDate ?? '',
          ),
        ),
    [state.events],
  );

  const loadPlanner = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    const { from, to } = dayRange(selectedDate);

    try {
      const [calendars, tasks, events] = await Promise.all([
        apiClient.listCalendars(),
        apiClient.listTasks(),
        apiClient.listEvents(from, to),
      ]);
      setState({ calendars, tasks, events, isLoading: false, error: null });
    } catch (error) {
      setState((current) => ({ ...current, isLoading: false, error: friendlyError(error) }));
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadPlanner();
  }, [loadPlanner]);

  const createCalendar = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = readFormString(form, 'name');
    const colorKey = readFormString(form, 'colorKey') || 'blue';

    try {
      await apiClient.createCalendar({ name, colorKey, defaultReminderMinutes: [10] }, csrfToken);
      event.currentTarget.reset();
      await loadPlanner();
    } catch (error) {
      setState((current) => ({ ...current, error: friendlyError(error) }));
    }
  };

  const createTask = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, 'title');
    const dueDate = readFormString(form, 'dueDate') || selectedDate;
    const estimateMinutes = Number(readFormString(form, 'estimateMinutes') || '30');

    try {
      await apiClient.createTask(
        { title, dueDate, priority: 'medium', estimateMinutes },
        csrfToken,
      );
      event.currentTarget.reset();
      await loadPlanner();
    } catch (error) {
      setState((current) => ({ ...current, error: friendlyError(error) }));
    }
  };

  const createEvent = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, 'title');
    const calendarId = readFormString(form, 'calendarId') || defaultCalendarId;
    const taskId = readFormString(form, 'taskId') || null;
    const start = readFormString(form, 'start');
    const end = readFormString(form, 'end');

    try {
      await apiClient.createEvent(
        {
          kind: 'timed',
          calendarId,
          title,
          taskId,
          startUtc: localInputToIso(start),
          endUtc: localInputToIso(end),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        csrfToken,
      );
      event.currentTarget.reset();
      await loadPlanner();
    } catch (error) {
      setState((current) => ({ ...current, error: friendlyError(error) }));
    }
  };

  const toggleTask = async (task: Task): Promise<void> => {
    try {
      await apiClient.updateTask(
        task.id,
        { status: task.status === 'done' ? 'todo' : 'done' },
        csrfToken,
      );
      await loadPlanner();
    } catch (error) {
      setState((current) => ({ ...current, error: friendlyError(error) }));
    }
  };

  const deleteTask = async (task: Task): Promise<void> => {
    try {
      await apiClient.deleteTask(task.id, csrfToken);
      await loadPlanner();
    } catch (error) {
      setState((current) => ({ ...current, error: friendlyError(error) }));
    }
  };

  const deleteEvent = async (eventBlock: EventBlock): Promise<void> => {
    try {
      await apiClient.deleteEvent(eventBlock.id, csrfToken);
      await loadPlanner();
    } catch (error) {
      setState((current) => ({ ...current, error: friendlyError(error) }));
    }
  };

  return (
    <div className="planner-grid">
      <section className="timeline-panel" aria-labelledby="timeline-title">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Plan</p>
            <h2 id="timeline-title">Timeline</h2>
          </div>
          <label className="date-control">
            Date
            <input
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

        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}

        {state.isLoading ? (
          <p role="status" aria-live="polite">
            Loading planner...
          </p>
        ) : (
          <div className="timeline-list">
            {visibleEvents.length === 0 && (
              <p className="empty-state">No blocks on this day yet.</p>
            )}
            {visibleEvents.map((eventBlock) => (
              <div className="timeline-row" key={eventBlock.id}>
                <span className="time">
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
                    {state.calendars.find((calendar) => calendar.id === eventBlock.calendarId)
                      ?.name ?? 'Calendar'}
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-action"
                  aria-label={`Delete ${eventBlock.title}`}
                  onClick={() => {
                    void deleteEvent(eventBlock);
                  }}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        <form className="inline-form" onSubmit={(event) => void createEvent(event)}>
          <input name="title" placeholder="Block title" required />
          <select
            key={defaultCalendarId}
            name="calendarId"
            aria-label="Calendar"
            required
            defaultValue={defaultCalendarId}
          >
            {state.calendars.map((calendar) => (
              <option value={calendar.id} key={calendar.id}>
                {calendar.name}
              </option>
            ))}
          </select>
          <select name="taskId" aria-label="Linked task" defaultValue="">
            <option value="">No linked task</option>
            {state.tasks.map((task) => (
              <option value={task.id} key={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <input name="start" type="datetime-local" required />
          <input name="end" type="datetime-local" required />
          <button type="submit" className="primary-action" disabled={!defaultCalendarId}>
            Add block
          </button>
        </form>
      </section>

      <div className="side-stack">
        <section className="task-panel" aria-labelledby="task-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inbox</p>
              <h2 id="task-title">Tasks</h2>
            </div>
            <span>{state.tasks.length} tasks</span>
          </div>

          <form className="inline-form" onSubmit={(event) => void createTask(event)}>
            <input name="title" placeholder="New task" required />
            <input key={selectedDate} name="dueDate" type="date" defaultValue={selectedDate} />
            <input name="estimateMinutes" type="number" min="5" max="1440" defaultValue="30" />
            <button type="submit" className="primary-action">
              Add task
            </button>
          </form>

          <ul className="task-list">
            {state.tasks.map((task) => (
              <li key={task.id} className={task.status === 'done' ? 'done' : ''}>
                <input
                  type="checkbox"
                  className="checkbox-action"
                  checked={task.status === 'done'}
                  aria-label={`Mark ${task.title} ${task.status === 'done' ? 'todo' : 'done'}`}
                  onChange={() => void toggleTask(task)}
                />
                <span>{task.title}</span>
                <small>{task.estimateMinutes}m</small>
                <button
                  type="button"
                  className="icon-action"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => void deleteTask(task)}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="calendar-panel" aria-labelledby="calendar-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Calendars</p>
              <h2 id="calendar-title">Sources</h2>
            </div>
            <span>{state.calendars.length}</span>
          </div>
          <form className="inline-form compact" onSubmit={(event) => void createCalendar(event)}>
            <input name="name" placeholder="Calendar name" required />
            <select name="colorKey" aria-label="Calendar color" defaultValue="blue">
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="rose">Rose</option>
            </select>
            <button type="submit" className="primary-action">
              Add calendar
            </button>
          </form>
          <div className="calendar-list">
            {state.calendars.map((calendar) => (
              <span className={`calendar-pill ${calendar.colorKey}`} key={calendar.id}>
                {calendar.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
