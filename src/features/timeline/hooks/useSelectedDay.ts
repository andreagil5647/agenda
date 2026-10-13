import { useCallback, useState } from 'react';
import { addDays, localDateOf } from '../../../lib/time/zonedTime';

interface SelectedDay {
  /** The calendar date on screen. */
  day: string;
  isToday: boolean;
  showDay: (day: string) => void;
  showToday: () => void;
  showPrevious: () => void;
  showNext: () => void;
}

/** The day the planner is showing, starting on today in the account's time zone. */
export function useSelectedDay(timeZone: string): SelectedDay {
  const today = localDateOf(new Date(), timeZone);
  const [day, setDay] = useState(today);

  const showToday = useCallback(() => {
    setDay(localDateOf(new Date(), timeZone));
  }, [timeZone]);

  const showPrevious = useCallback(() => {
    setDay((current) => addDays(current, -1));
  }, []);

  const showNext = useCallback(() => {
    setDay((current) => addDays(current, 1));
  }, []);

  return { day, isToday: day === today, showDay: setDay, showToday, showPrevious, showNext };
}
