import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/ApiError';

const STALE_AFTER_MS = 30_000;
const MAX_NETWORK_RETRIES = 1;

interface QueryClientEvents {
  /** A change could not be saved. Reads report their own errors where they are shown. */
  onWriteError: (error: unknown) => void;
  /** The API no longer recognises the session, on any request. */
  onSessionEnded: () => void;
}

function isCode(error: unknown, code: ApiError['code']): boolean {
  return error instanceof ApiError && error.code === code;
}

/**
 * The cache every screen reads server data from. One client is created per
 * signed-in session, so nothing cached for one account can reach the next.
 */
export function createQueryClient({
  onWriteError,
  onSessionEnded,
}: QueryClientEvents): QueryClient {
  const handleError = (error: unknown, report: (error: unknown) => void): void => {
    if (isCode(error, 'UNAUTHORIZED')) {
      onSessionEnded();
    } else {
      report(error);
    }
  };

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        handleError(error, () => undefined);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleError(error, onWriteError);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_AFTER_MS,
        // Only a request that never reached the server is worth repeating;
        // an answer from the API, even an error, would be the same again.
        retry: (failureCount, error) =>
          isCode(error, 'NETWORK_ERROR') && failureCount < MAX_NETWORK_RETRIES,
      },
    },
  });
}
