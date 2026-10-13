import { api, unwrap } from '../../../lib/api/client';
import type { Calendar, CreateCalendarRequest } from '../../../lib/api/contract';

export function listCalendars(): Promise<Calendar[]> {
  return unwrap(api.GET('/api/v1/calendars'));
}

export function createCalendar(input: CreateCalendarRequest): Promise<Calendar> {
  return unwrap(api.POST('/api/v1/calendars', { body: input }));
}
