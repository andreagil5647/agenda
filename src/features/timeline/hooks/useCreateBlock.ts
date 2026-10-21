import { useCallback } from 'react';
import type { Calendar, PlannerEvent } from '../../../lib/api/contract';
import { instantAt } from '../../../lib/time/zonedTime';
import type { TimeSpan } from '../dayLayout';
import { blockKey, provisionalEvent } from '../provisionalEvent';
import { useCreateEvent } from './useEvents';

interface NewBlock {
  title: string;
  span: TimeSpan;
  /** The task this block is time set aside for. */
  taskId?: string;
  /** Called with the key of the block as soon as it is on the timeline, before it is saved. */
  onShown?: (key: string) => void;
  onSaved?: (event: PlannerEvent) => void;
}

interface CreateBlockOptions {
  day: string;
  timeZone: string;
  /** New blocks go to this calendar; without one none can be created. */
  calendar: Calendar | undefined;
}

/**
 * Creates a block on `day` from a span of its wall clock. The block appears
 * on the timeline at once and is confirmed, or taken back, by the API.
 */
export function useCreateBlock({
  day,
  timeZone,
  calendar,
}: CreateBlockOptions): (block: NewBlock) => void {
  const { mutate } = useCreateEvent();

  return useCallback(
    ({ title, span, taskId, onShown, onSaved }) => {
      if (!calendar) return;

      const input = {
        kind: 'timed',
        calendarId: calendar.id,
        title,
        taskId: taskId ?? null,
        startUtc: instantAt(day, span.startMinutes, timeZone).toISOString(),
        endUtc: instantAt(day, span.endMinutes, timeZone).toISOString(),
        timeZone,
      } as const;

      const provisional = provisionalEvent(input, new Date());
      onShown?.(blockKey(provisional));
      mutate({ input, provisional }, onSaved ? { onSuccess: onSaved } : undefined);
    },
    [calendar, day, timeZone, mutate],
  );
}
