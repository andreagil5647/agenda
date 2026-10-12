import { useEffect, useRef, useState } from 'react';
import { env } from '../env';

export type ServerStatus = 'checking' | 'ready' | 'waking' | 'error';

export interface ServerStatusState {
  status: ServerStatus;
  /** How long the current check has been retrying, for the "waking" copy. */
  elapsedMs: number;
}

const RETRY_DELAYS_MS = [500, 1000, 1500, 2500, 4000, 6000, 8000];
const WAKING_AFTER_MS = 2500;
const GIVE_UP_AFTER_MS = 90_000;

/**
 * Free hosting spins the API down after 15 minutes idle and takes about a
 * minute to wake back up. This polls the liveness endpoint - which never
 * touches the database - with backoff, and exposes a "waking" state once
 * the first response takes longer than what a warm server would need, so
 * the UI can show a friendly message instead of a blank screen or a
 * generic error.
 */
export function useServerStatus(): ServerStatusState {
  const [state, setState] = useState<ServerStatusState>({ status: 'checking', elapsedMs: 0 });
  const attemptRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = Date.now();
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    attemptRef.current = 0;

    const check = (): void => {
      fetch(`${env.apiBaseUrl}/health`, { signal: controller.signal })
        .then((res) => {
          if (!isActive) return;
          if (!res.ok) throw new Error(`Unexpected status ${String(res.status)}`);
          setState({ status: 'ready', elapsedMs: Date.now() - startedAt });
        })
        .catch(() => {
          if (!isActive) return;

          const elapsedMs = Date.now() - startedAt;
          if (elapsedMs >= GIVE_UP_AFTER_MS) {
            setState({ status: 'error', elapsedMs });
            return;
          }

          setState({
            status: elapsedMs >= WAKING_AFTER_MS ? 'waking' : 'checking',
            elapsedMs,
          });

          const delay = RETRY_DELAYS_MS[Math.min(attemptRef.current, RETRY_DELAYS_MS.length - 1)];
          attemptRef.current += 1;
          timeoutId = setTimeout(check, delay);
        });
    };

    check();

    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
}
