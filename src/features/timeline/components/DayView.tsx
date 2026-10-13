import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo, type JSX } from 'react';
import type { Calendar, PlannerEvent } from '../../../lib/api/contract';
import type { HourCycle } from '../../../lib/time/formatTime';
import { instantAt, minutesOfDay } from '../../../lib/time/zonedTime';
import controls from '../../../ui/controls.module.css';
import { Panel } from '../../../ui/Panel';
import { QueryBoundary } from '../../../ui/QueryBoundary';
import {
  firstFreeStart,
  layoutDayBlocks,
  slotStart,
  spanAt,
  toDayBlocks,
  type TimeSpan,
} from '../dayLayout';
import { useCreateEvent } from '../hooks/useEvents';
import { useNow } from '../hooks/useNow';
import { provisionalEvent } from '../provisionalEvent';
import { AllDayRow } from './AllDayRow';
import { DayGrid } from './DayGrid';
import styles from './DayView.module.css';

const NEW_BLOCK_TITLE = 'New block';
const NEW_BLOCK_MINUTES = 30;
const START_OF_WORKDAY_MINUTES = 9 * 60;
/** How much of the day before the first thing of interest stays in view. */
const LEAD_IN_MINUTES = 45;

interface DayViewProps {
  day: string;
  isToday: boolean;
  timeZone: string;
  hourCycle: HourCycle;
  eventsQuery: UseQueryResult<PlannerEvent[]>;
  calendars: Calendar[];
  selectedEventId: string | null;
  onSelectEvent: (event: PlannerEvent) => void;
}

/** One day of the plan: its all-day events, and its blocks on the hour grid. */
export function DayView({
  day,
  isToday,
  timeZone,
  hourCycle,
  eventsQuery,
  calendars,
  selectedEventId,
  onSelectEvent,
}: DayViewProps): JSX.Element {
  const now = useNow();
  const createEvent = useCreateEvent();

  const events = eventsQuery.data;
  const blocks = useMemo(
    () => layoutDayBlocks(toDayBlocks(events ?? [], day, timeZone)),
    [events, day, timeZone],
  );
  const allDayEvents = useMemo(
    () => (events ?? []).filter((event) => event.kind === 'allDay'),
    [events],
  );

  const nowMinutes = isToday ? minutesOfDay(now, timeZone) : null;
  const defaultCalendar = calendars[0];
  const firstBlockStart = blocks[0]?.startMinutes ?? START_OF_WORKDAY_MINUTES;
  const initialMinutes = Math.max(
    0,
    Math.min(firstBlockStart, nowMinutes ?? START_OF_WORKDAY_MINUTES) - LEAD_IN_MINUTES,
  );

  const createBlock = (span: TimeSpan): void => {
    if (!defaultCalendar) return;

    const input = {
      kind: 'timed',
      calendarId: defaultCalendar.id,
      title: NEW_BLOCK_TITLE,
      startUtc: instantAt(day, span.startMinutes, timeZone).toISOString(),
      endUtc: instantAt(day, span.endMinutes, timeZone).toISOString(),
      timeZone,
    } as const;

    // The new block is selected once saved, so its title can be typed straight away.
    createEvent.mutate(
      { input, provisional: provisionalEvent(input, new Date()) },
      { onSuccess: onSelectEvent },
    );
  };

  const createAtNextFreeTime = (): void => {
    const from = nowMinutes ?? START_OF_WORKDAY_MINUTES;
    createBlock(spanAt(firstFreeStart(blocks, NEW_BLOCK_MINUTES, from) ?? from, NEW_BLOCK_MINUTES));
  };

  return (
    <Panel
      eyebrow="Plan"
      title="Timeline"
      aside={
        <button
          type="button"
          className={controls.primaryAction}
          disabled={!defaultCalendar}
          onClick={createAtNextFreeTime}
        >
          Add block
        </button>
      }
    >
      <QueryBoundary query={eventsQuery} loadingLabel="Loading the day...">
        {() => (
          <>
            {!defaultCalendar && (
              <p className={styles.hint}>Add a calendar first: every block belongs to one.</p>
            )}
            <AllDayRow
              events={allDayEvents}
              calendars={calendars}
              selectedEventId={selectedEventId}
              onSelectEvent={onSelectEvent}
            />
            <DayGrid
              // A different day is a different grid: it scrolls to its own first block.
              key={day}
              blocks={blocks}
              calendars={calendars}
              hourCycle={hourCycle}
              nowMinutes={nowMinutes}
              initialMinutes={initialMinutes}
              selectedEventId={selectedEventId}
              onSelectEvent={onSelectEvent}
              onCreateAt={(minutes) => {
                createBlock(spanAt(slotStart(minutes), NEW_BLOCK_MINUTES));
              }}
            />
          </>
        )}
      </QueryBoundary>
    </Panel>
  );
}
