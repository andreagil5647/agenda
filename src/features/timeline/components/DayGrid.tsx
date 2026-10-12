import { useEffect, useRef, type JSX, type MouseEvent } from 'react';
import type { Calendar, PlannerEvent } from '../../../lib/api/contract';
import { formatTimeOfDay, type HourCycle } from '../../../lib/time/formatTime';
import { MINUTES_PER_DAY } from '../../../lib/time/zonedTime';
import { minutesAtOffset, type PlacedBlock } from '../dayLayout';
import styles from './DayGrid.module.css';
import { TimeBlock } from './TimeBlock';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

interface DayGridProps {
  blocks: PlacedBlock[];
  calendars: Calendar[];
  hourCycle: HourCycle;
  /** The current time of day when the grid shows today, to draw the "now" line. */
  nowMinutes: number | null;
  /** The time of day to bring into view when the grid first appears. */
  initialMinutes: number;
  selectedEventId: string | null;
  onSelectEvent: (event: PlannerEvent) => void;
  /** Called with the time of day at the point of the grid that was clicked. */
  onCreateAt: (minutes: number) => void;
}

/** A day as a column of hours, with each block placed at its time. */
export function DayGrid({
  blocks,
  calendars,
  hourCycle,
  nowMinutes,
  initialMinutes,
  selectedEventId,
  onSelectEvent,
  onCreateAt,
}: DayGridProps): JSX.Element {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Only on mount: after that the scroll position belongs to the user.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollTop = (initialMinutes / MINUTES_PER_DAY) * scroller.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createAtPointer = (event: MouseEvent<HTMLOListElement>): void => {
    // A click on a block selects that block; only the empty grid creates one.
    if (event.target !== event.currentTarget) return;
    const column = event.currentTarget.getBoundingClientRect();
    onCreateAt(minutesAtOffset(event.clientY - column.top, column.height));
  };

  return (
    <div className={styles.scroller} ref={scrollerRef}>
      <div className={styles.grid}>
        <ol className={styles.hours} aria-hidden="true">
          {HOURS.map((hour) => (
            <li key={hour}>{formatTimeOfDay(hour * 60, hourCycle)}</li>
          ))}
        </ol>

        {/* Clicking the empty grid is a pointer shortcut. The "Add block" button
            above the grid does the same from the keyboard. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <ol className={styles.column} aria-label="Blocks" onClick={createAtPointer}>
          {blocks.map((block) => (
            <TimeBlock
              key={block.event.id}
              block={block}
              calendar={calendars.find((calendar) => calendar.id === block.event.calendarId)}
              hourCycle={hourCycle}
              isSelected={block.event.id === selectedEventId}
              onSelect={onSelectEvent}
            />
          ))}
          {nowMinutes !== null && (
            <li className={styles.now} style={{ '--at': nowMinutes }} aria-hidden="true" />
          )}
        </ol>
      </div>
    </div>
  );
}
