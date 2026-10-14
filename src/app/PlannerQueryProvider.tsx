import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type JSX, type ReactNode } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { describeError } from '../lib/api/errorMessages';
import { createQueryClient } from '../lib/query/createQueryClient';
import { useNotify } from '../ui/notices/NoticeProvider';

/**
 * Gives the signed-in part of the app its server-state cache. It is mounted
 * only while someone is signed in, so signing out drops everything cached for
 * that account, and connects the cache's failures to the rest of the app: a
 * write that could not be saved becomes a notice, and a rejected session
 * returns to the sign-in screen.
 */
export function PlannerQueryProvider({ children }: { children: ReactNode }): JSX.Element {
  const notify = useNotify();
  const { expireSession } = useAuth();
  const [queryClient] = useState(() =>
    createQueryClient({
      onWriteError: (error) => {
        notify((t) => describeError(error, t));
      },
      onSessionEnded: expireSession,
    }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
