import { useEffect, useState } from 'react';

const ONE_MINUTE_MS = 60_000;

/** The current time, refreshed often enough to keep a minute-precision display right. */
export function useNow(refreshMs = ONE_MINUTE_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, refreshMs);
    return () => {
      clearInterval(timer);
    };
  }, [refreshMs]);

  return now;
}
