import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { PlannerEvent } from '../../../lib/api/contract';
import { dayRange } from '../../../lib/time/zonedTime';
import { layoutDayBlocks, toDayBlocks, type PlacedBlock } from '../dayLayout';
import { useEvents } from './useEvents';

interface DayPlan {
  eventsQuery: UseQueryResult<PlannerEvent[]>;
  /** The day's timed events, placed on the grid. */
  blocks: PlacedBlock[];
  allDayEvents: PlannerEvent[];
}

/** Everything planned on `day`, as the account's time zone sees that day. */
export function useDayPlan(day: string, timeZone: string): DayPlan {
  const range = useMemo(() => dayRange(day, timeZone), [day, timeZone]);
  const eventsQuery = useEvents(range);
  const events = eventsQuery.data;

  const blocks = useMemo(
    () => layoutDayBlocks(toDayBlocks(events ?? [], day, timeZone)),
    [events, day, timeZone],
  );
  const allDayEvents = useMemo(
    () => (events ?? []).filter((event) => event.kind === 'allDay'),
    [events],
  );

  return { eventsQuery, blocks, allDayEvents };
}
