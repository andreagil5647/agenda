import type { JSX } from 'react';
import { CalendarPanel } from '../features/calendars/components/CalendarPanel';
import { TaskPanel } from '../features/tasks/components/TaskPanel';
import { DayHeader } from '../features/timeline/components/DayHeader';
import { DayTimeline } from '../features/timeline/components/DayTimeline';
import { useSelectedDay } from '../features/timeline/hooks/useSelectedDay';
import type { AuthUser } from '../lib/api/contract';
import styles from './PlannerPage.module.css';

interface PlannerPageProps {
  /** Days are laid out in this account's time zone and written in its locale. */
  settings: AuthUser['settings'];
}

/** The day planner: one day's timeline next to the tasks and calendars that feed it. */
export function PlannerPage({ settings }: PlannerPageProps): JSX.Element {
  const { timeZone, hourCycle, locale } = settings;
  const selected = useSelectedDay(timeZone);

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
        <DayTimeline day={selected.day} timeZone={timeZone} hourCycle={hourCycle} />
        <div className={styles.side}>
          <TaskPanel day={selected.day} />
          <CalendarPanel />
        </div>
      </div>
    </>
  );
}
