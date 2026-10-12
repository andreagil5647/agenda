import { useMemo, useState, type JSX } from 'react';
import { CalendarPanel } from '../features/calendars/components/CalendarPanel';
import { useCalendars } from '../features/calendars/hooks/useCalendars';
import { TaskPanel } from '../features/tasks/components/TaskPanel';
import { useTasks } from '../features/tasks/hooks/useTasks';
import { BlockEditor } from '../features/timeline/components/BlockEditor';
import { DayHeader } from '../features/timeline/components/DayHeader';
import { DayView } from '../features/timeline/components/DayView';
import { useEvents } from '../features/timeline/hooks/useEvents';
import { useSelectedDay } from '../features/timeline/hooks/useSelectedDay';
import type { AuthUser } from '../lib/api/contract';
import { dayRange } from '../lib/time/zonedTime';
import styles from './PlannerPage.module.css';

interface PlannerPageProps {
  /** Days are laid out in this account's time zone and written in its locale. */
  settings: AuthUser['settings'];
}

/** The day planner: one day's timeline next to the tasks and calendars that feed it. */
export function PlannerPage({ settings }: PlannerPageProps): JSX.Element {
  const { timeZone, hourCycle, locale } = settings;
  const selected = useSelectedDay(timeZone);
  const range = useMemo(() => dayRange(selected.day, timeZone), [selected.day, timeZone]);

  const eventsQuery = useEvents(range);
  const calendars = useCalendars().data ?? [];
  const tasks = useTasks().data ?? [];

  // Selection is kept by id: the event itself is replaced each time it is saved.
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = eventsQuery.data?.find((event) => event.id === selectedEventId);

  return (
    <>
      <DayHeader
        day={selected.day}
        isToday={selected.isToday}
        locale={locale}
        onShowDay={selected.showDay}
        onShowToday={selected.showToday}
        onShowPrevious={selected.showPrevious}
        onShowNext={selected.showNext}
      />
      <div className={styles.layout}>
        <DayView
          day={selected.day}
          isToday={selected.isToday}
          timeZone={timeZone}
          hourCycle={hourCycle}
          eventsQuery={eventsQuery}
          calendars={calendars}
          selectedEventId={selectedEventId}
          onSelectEvent={(event) => {
            setSelectedEventId(event.id);
          }}
        />
        <div className={styles.side}>
          {selectedEvent && (
            <BlockEditor
              event={selectedEvent}
              calendars={calendars}
              linkedTask={tasks.find((task) => task.id === selectedEvent.taskId)}
              timeZone={timeZone}
              onClose={() => {
                setSelectedEventId(null);
              }}
            />
          )}
          <TaskPanel day={selected.day} />
          <CalendarPanel />
        </div>
      </div>
    </>
  );
}
