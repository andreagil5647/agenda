import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CreateEventRequest, PlannerEvent } from '../../../lib/api/contract';
import { withItem, withReplaced, withoutItem } from '../../../lib/query/listEdits';
import { useOptimisticListMutation } from '../../../lib/query/useOptimisticListMutation';
import { createEvent, deleteEvent, listEvents, type InstantRange } from '../api/eventsApi';

// Events are cached per range. Writes edit every cached range at once, since
// the same event can be on screen in more than one of them.
const eventsKey = ['events'] as const;

export function useEvents(range: InstantRange): UseQueryResult<PlannerEvent[]> {
  return useQuery({
    queryKey: [...eventsKey, range.from, range.to],
    queryFn: () => listEvents(range),
  });
}

interface EventCreation {
  input: CreateEventRequest;
  /** Shown while the request is on its way; see provisionalEvent. */
  provisional: PlannerEvent;
}

export function useCreateEvent() {
  return useOptimisticListMutation<PlannerEvent, EventCreation, PlannerEvent>({
    queryKey: eventsKey,
    mutationFn: ({ input }) => createEvent(input),
    optimistic: (events, { provisional }) => withItem(events, provisional),
    confirmed: (events, saved, { provisional }) => withReplaced(events, provisional.id, saved),
  });
}

export function useDeleteEvent() {
  return useOptimisticListMutation<PlannerEvent, PlannerEvent>({
    queryKey: eventsKey,
    mutationFn: (event, atSavedVersion) => deleteEvent(atSavedVersion(event)),
    optimistic: (events, event) => withoutItem(events, event.id),
    confirmed: (events) => events,
  });
}
