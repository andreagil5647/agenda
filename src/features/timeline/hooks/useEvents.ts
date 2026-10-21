import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  CreateEventRequest,
  PatchEventRequest,
  PlannerEvent,
} from '../../../lib/api/contract';
import { withChanges, withItem, withReplaced, withoutItem } from '../../../lib/query/listEdits';
import { useOptimisticListMutation } from '../../../lib/query/useOptimisticListMutation';
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  type InstantRange,
} from '../api/eventsApi';
import { rememberReplacement } from '../provisionalEvent';

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
    confirmed: (events, saved, { provisional }) => {
      rememberReplacement(provisional.id, saved);
      return withReplaced(events, provisional.id, saved);
    },
  });
}

interface EventUpdate {
  event: PlannerEvent;
  changes: PatchEventRequest;
}

/** Shows the change at once; the saved event then replaces it, carrying its new version. */
export function useUpdateEvent() {
  return useOptimisticListMutation<PlannerEvent, EventUpdate, PlannerEvent>({
    queryKey: eventsKey,
    mutationFn: ({ event, changes }, atSavedVersion) => updateEvent(atSavedVersion(event), changes),
    optimistic: (events, { event, changes }) => withChanges(events, event.id, changes),
    confirmed: (events, saved, { event }) => withReplaced(events, event.id, saved),
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
