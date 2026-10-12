import { api, ifMatch, unwrap, unwrapEmpty } from '../../../lib/api/client';
import type {
  CreateEventRequest,
  PatchEventRequest,
  PlannerEvent,
} from '../../../lib/api/contract';

/** A half-open range of instants, as ISO strings: from `from` up to, not including, `to`. */
export interface InstantRange {
  from: string;
  to: string;
}

export function listEvents(range: InstantRange): Promise<PlannerEvent[]> {
  return unwrap(api.GET('/api/v1/events', { params: { query: range } }));
}

export function createEvent(input: CreateEventRequest): Promise<PlannerEvent> {
  return unwrap(api.POST('/api/v1/events', { body: input }));
}

export function updateEvent(
  event: PlannerEvent,
  changes: PatchEventRequest,
): Promise<PlannerEvent> {
  return unwrap(
    api.PATCH('/api/v1/events/{id}', {
      params: { path: { id: event.id }, header: ifMatch(event) },
      body: changes,
    }),
  );
}

export function deleteEvent(event: PlannerEvent): Promise<void> {
  return unwrapEmpty(
    api.DELETE('/api/v1/events/{id}', {
      params: { path: { id: event.id }, header: ifMatch(event) },
    }),
  );
}
