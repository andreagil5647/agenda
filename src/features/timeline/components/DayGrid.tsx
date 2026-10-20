import { useDroppable } from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, type JSX, type MouseEvent } from 'react';
import type { Calendar, PlannerEvent } from '../../../lib/api/contract';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import { formatTimeOfDay, type HourCycle } from '../../../lib/time/formatTime';
import { MINUTES_PER_DAY } from '../../../lib/time/zonedTime';
import controls from '../../../ui/controls.module.css';
import { minutesAtOffset, type PlacedBlock, type TimeSpan } from '../dayLayout';
import { DAY_GRID_DROP_ID, type DayGridTarget } from '../planningDrag';
import type { BlockMotion } from '../hooks/useBlockMotion';
import { blockKey } from '../provisionalEvent';
import styles from './DayGrid.module.css';
import { BLOCK_SHORTCUTS_ID, LeavingBlock, TimeBlock } from './TimeBlock';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

interface DayGridProps {
  blocks: PlacedBlock[];
  calendars: Calendar[];
  hourCycle: HourCycle;
  /** The current time of day when the grid shows today, to draw the "now" line. */
  nowMinutes: number | null;
  /** The time of day to bring into view when the grid first appears. */
  initialMinutes: number;
  /** Where something being dragged over the grid would land. */
  landingSpan: TimeSpan | null;
  /** Called when the grid scrolls, which moves the time under a held pointer. */
  onScroll: () => void;
  /** What the grid is doing to its blocks because of what the reader did. */
  motion: BlockMotion;
  selectedEventId: string | null;
  onSelectEvent: (event: PlannerEvent) => void;
  onMoveBlock: (event: PlannerEvent, span: TimeSpan) => void;
  onResizeBlock: (event: PlannerEvent, span: TimeSpan) => void;
  onDeleteBlock: (event: PlannerEvent) => void;
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
  landingSpan,
  onScroll,
  motion,
  selectedEventId,
  onSelectEvent,
  onMoveBlock,
  onResizeBlock,
  onDeleteBlock,
  onCreateAt,
}: DayGridProps): JSX.Element {
  const { t, locale } = useI18n();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  // A deleted block that comes back, because the API refused to delete it, is not leaving after all.
  const leavingBlocks = motion.leaving.filter(
    (leaving) => !blocks.some((block) => blockKey(block.event) === blockKey(leaving.event)),
  );

  // The drop target is the part of the day that is scrolled into view, so the
  // time under a screen position depends on how far the grid is scrolled.
  const dropTarget = useMemo<DayGridTarget>(
    () => ({
      minutesAt: (clientY) => {
        const scroller = scrollerRef.current;
        if (!scroller) return 0;
        const offset = clientY - scroller.getBoundingClientRect().top + scroller.scrollTop;
        return minutesAtOffset(offset, scroller.scrollHeight);
      },
    }),
    [],
  );
  const { setNodeRef } = useDroppable({ id: DAY_GRID_DROP_ID, data: dropTarget });
  const setScroller = useCallback(
    (node: HTMLDivElement | null) => {
      scrollerRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

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
    <div className={styles.scroller} ref={setScroller} onScroll={onScroll}>
      <p id={BLOCK_SHORTCUTS_ID} className={controls.visuallyHidden}>
        {t('timeline.shortcuts')}
      </p>
      <div className={styles.grid}>
        <ol className={styles.hours} aria-hidden="true">
          {HOURS.map((hour) => (
            <li key={hour}>{formatTimeOfDay(hour * 60, hourCycle, locale)}</li>
          ))}
        </ol>

        {/* Clicking the empty grid is a pointer shortcut. The "Add block" button
            above the grid does the same from the keyboard. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <ol className={styles.column} aria-label={t('timeline.blocks')} onClick={createAtPointer}>
          {blocks.map((block) => {
            const key = blockKey(block.event);
            return (
              <TimeBlock
                key={key}
                block={block}
                calendar={calendars.find((calendar) => calendar.id === block.event.calendarId)}
                hourCycle={hourCycle}
                isSelected={block.event.id === selectedEventId}
                arrival={motion.arrivals.get(key)}
                onArrived={() => {
                  motion.arrived(key);
                }}
                onSelect={onSelectEvent}
                onMove={onMoveBlock}
                onResize={onResizeBlock}
                onDelete={onDeleteBlock}
              />
            );
          })}
          {leavingBlocks.map((block) => (
            <LeavingBlock
              key={`leaving-${blockKey(block.event)}`}
              block={block}
              calendar={calendars.find((calendar) => calendar.id === block.event.calendarId)}
              hourCycle={hourCycle}
              onGone={() => {
                motion.left(blockKey(block.event));
              }}
            />
          ))}
          {landingSpan && (
            <li
              className={styles.landing}
              style={{ '--start': landingSpan.startMinutes, '--end': landingSpan.endMinutes }}
              aria-hidden="true"
            >
              {formatTimeOfDay(landingSpan.startMinutes, hourCycle, locale)}
            </li>
          )}
          {nowMinutes !== null && (
            <li className={styles.now} style={{ '--at': nowMinutes }} aria-hidden="true" />
          )}
        </ol>
      </div>
    </div>
  );
}
