import type { CreateEventRequest, PlannerEvent } from '../../lib/api/contract';

const PROVISIONAL_PREFIX = 'provisional-';
let sequence = 0;

/**
 * A stand-in for an event that has been sent to the API but not confirmed.
 * It is shown on the timeline straight away and replaced by the saved event,
 * or removed if the API refuses it. Until then it has no version, so it
 * cannot be changed or deleted.
 */
export function provisionalEvent(input: CreateEventRequest, now: Date): PlannerEvent {
  sequence += 1;
  const timestamp = now.toISOString();
  const timed = input.kind === 'timed';

  return {
    id: `${PROVISIONAL_PREFIX}${String(sequence)}`,
    calendarId: input.calendarId,
    title: input.title,
    notes: input.notes ?? null,
    taskId: input.taskId ?? null,
    kind: input.kind,
    startUtc: timed ? input.startUtc : null,
    endUtc: timed ? input.endUtc : null,
    timeZone: timed ? input.timeZone : null,
    startDate: timed ? null : input.startDate,
    endDate: timed ? null : input.endDate,
    version: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function isProvisional(event: PlannerEvent): boolean {
  return event.id.startsWith(PROVISIONAL_PREFIX);
}
