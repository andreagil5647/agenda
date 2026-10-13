import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Calendar, CreateCalendarRequest } from '../../../lib/api/contract';
import { withItem } from '../../../lib/query/listEdits';
import { useOptimisticListMutation } from '../../../lib/query/useOptimisticListMutation';
import { createCalendar, listCalendars } from '../api/calendarsApi';

const calendarsKey = ['calendars'] as const;

export function useCalendars(): UseQueryResult<Calendar[]> {
  return useQuery({ queryKey: calendarsKey, queryFn: listCalendars });
}

/** A new calendar joins the list once the API has given it an id and a position. */
export function useCreateCalendar() {
  return useOptimisticListMutation<Calendar, CreateCalendarRequest, Calendar>({
    queryKey: calendarsKey,
    mutationFn: (input) => createCalendar(input),
    optimistic: (calendars) => calendars,
    confirmed: withItem,
  });
}
