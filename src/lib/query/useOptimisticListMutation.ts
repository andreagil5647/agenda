import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';

/** What the API gives every stored resource: an id, and a version that changes on each write. */
interface Versioned {
  id: string;
  version: number;
}

/** Returns `item` carrying the version the cache last received from the API for it. */
type AtSavedVersion<TItem> = (item: TItem) => TItem;

interface OptimisticListOptions<TItem, TVariables, TResult> {
  /** Every cached list whose key starts with this one is edited. */
  queryKey: QueryKey;
  mutationFn: (variables: TVariables, atSavedVersion: AtSavedVersion<TItem>) => Promise<TResult>;
  /** The list as it should look while the request is on its way. */
  optimistic: (items: TItem[], variables: TVariables) => TItem[];
  /**
   * The list once the API has answered, usually with the saved item swapped
   * in so its new version is the one the next change is based on.
   */
  confirmed: (items: TItem[], result: TResult, variables: TVariables) => TItem[];
}

type Snapshot<TItem> = [QueryKey, TItem[] | undefined][];

function savedVersionOf(queryClient: QueryClient, queryKey: QueryKey, item: Versioned): number {
  for (const [, items] of queryClient.getQueriesData<Versioned[]>({ queryKey })) {
    const cached = items?.find((candidate) => candidate.id === item.id);
    if (cached) return cached.version;
  }
  return item.version;
}

/**
 * A write that shows its result at once and takes it back if the API refuses.
 *
 * The cached lists are changed before the request is sent. On success they
 * are corrected with the server's answer; on failure they are restored and
 * then refetched, so what is on screen is what the server has, which matters
 * most when the failure was that someone else changed the same item.
 *
 * Writes to the same lists are sent one at a time. The API only accepts a
 * change based on the current version of a resource, so a second change made
 * while the first is still on its way has to wait for the version the first
 * one produces; `atSavedVersion` hands that version to the request.
 */
export function useOptimisticListMutation<TItem extends Versioned, TVariables, TResult = void>({
  queryKey,
  mutationFn,
  optimistic,
  confirmed,
}: OptimisticListOptions<TItem, TVariables, TResult>): UseMutationResult<
  TResult,
  Error,
  TVariables,
  Snapshot<TItem>
> {
  const queryClient = useQueryClient();

  return useMutation({
    scope: { id: JSON.stringify(queryKey) },
    mutationFn: (variables) =>
      mutationFn(variables, (item) => ({
        ...item,
        version: savedVersionOf(queryClient, queryKey, item),
      })),
    onMutate: async (variables) => {
      // A fetch already in flight would overwrite the optimistic list when it lands.
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueriesData<TItem[]>({ queryKey });
      queryClient.setQueriesData<TItem[]>({ queryKey }, (items) =>
        items ? optimistic(items, variables) : items,
      );
      return snapshot;
    },
    onSuccess: (result, variables) => {
      queryClient.setQueriesData<TItem[]>({ queryKey }, (items) =>
        items ? confirmed(items, result, variables) : items,
      );
    },
    onError: (_error, _variables, snapshot) => {
      for (const [key, items] of snapshot ?? []) {
        queryClient.setQueryData(key, items);
      }
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
