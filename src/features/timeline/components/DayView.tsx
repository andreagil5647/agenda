import type { UseQueryResult } from '@tanstack/react-query';
import type { JSX } from 'react';
import type { Calendar, PlannerEvent } from '../../../lib/api/contract';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import type { HourCycle } from '../../../lib/time/formatTime';
import controls from '../../../ui/controls.module.css';
import { EmptyState } from '../../../ui/EmptyState';
import { Icon } from '../../../ui/Icon';
import { Panel } from '../../../ui/Panel';
import { QueryBoundary } from '../../../ui/QueryBoundary';
import { slotStart, spanAt, type PlacedBlock, type TimeSpan } from '../dayLayout';
import type { BlockMotion } from '../hooks/useBlockMotion';
import { AllDayRow } from './AllDayRow';
import { DayGrid } from './DayGrid';
import styles from './DayView.module.css';

export const NEW_BLOCK_MINUTES = 30;
export const START_OF_WORKDAY_MINUTES = 9 * 60;
/** How much of the day before the first thing of interest stays in view. */
const LEAD_IN_MINUTES = 45;

interface DayViewProps {
  day: string;
  hourCycle: HourCycle;
  eventsQuery: UseQueryResult<PlannerEvent[]>;
  blocks: PlacedBlock[];
  allDayEvents: PlannerEvent[];
  calendars: Calendar[];
  /** The current time of day when the day in view is today. */
  nowMinutes: number | null;
  /** Where something being dragged over the grid would land. */
  landingSpan: TimeSpan | null;
  onGridScroll: () => void;
  motion: BlockMotion;
  selectedEventId: string | null;
  onSelectEvent: (event: PlannerEvent) => void;
  onMoveBlock: (event: PlannerEvent, span: TimeSpan) => void;
  onResizeBlock: (event: PlannerEvent, span: TimeSpan) => void;
  onDeleteBlock: (event: PlannerEvent) => void;
  /** Creates an untitled block on the given span. */
  onCreateBlock: (span: TimeSpan) => void;
  /** Creates an untitled block at the next free time. */
  onAddBlock: () => void;
}

/** One day of the plan: its all-day events, and its blocks on the hour grid. */
export function DayView({
  day,
  hourCycle,
  eventsQuery,
  blocks,
  allDayEvents,
  calendars,
  nowMinutes,
  landingSpan,
  onGridScroll,
  motion,
  selectedEventId,
  onSelectEvent,
  onMoveBlock,
  onResizeBlock,
  onDeleteBlock,
  onCreateBlock,
  onAddBlock,
}: DayViewProps): JSX.Element {
  const { t } = useI18n();
  const hasCalendar = calendars.length > 0;
  const isEmptyDay = blocks.length === 0 && allDayEvents.length === 0;
  const firstBlockStart = blocks[0]?.startMinutes ?? START_OF_WORKDAY_MINUTES;
  const initialMinutes = Math.max(
    0,
    Math.min(firstBlockStart, nowMinutes ?? START_OF_WORKDAY_MINUTES) - LEAD_IN_MINUTES,
  );

  return (
    <Panel
      title={t('timeline.title')}
      icon="clock"
      aside={
        <button
          type="button"
          className={controls.primaryAction}
          disabled={!hasCalendar}
          onClick={onAddBlock}
        >
          <Icon name="plus" />
          {t('timeline.addBlock')}
        </button>
      }
    >
      <QueryBoundary query={eventsQuery} loadingLabel={t('timeline.loading')}>
        {() => (
          <>
            {!hasCalendar && <p className={styles.hint}>{t('timeline.needCalendar')}</p>}
            {hasCalendar && isEmptyDay && (
              <div className={styles.empty}>
                <EmptyState icon="sparkle" title={t('timeline.empty.title')}>
                  {t('timeline.empty.hint', { addBlock: t('timeline.addBlock') })}
                </EmptyState>
              </div>
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
              landingSpan={landingSpan}
              onScroll={onGridScroll}
              motion={motion}
              selectedEventId={selectedEventId}
              onSelectEvent={onSelectEvent}
              onMoveBlock={onMoveBlock}
              onResizeBlock={onResizeBlock}
              onDeleteBlock={onDeleteBlock}
              onCreateAt={(minutes) => {
                onCreateBlock(spanAt(slotStart(minutes), NEW_BLOCK_MINUTES));
              }}
            />
          </>
        )}
      </QueryBoundary>
    </Panel>
  );
}
