import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';

interface OptimisticListOptions<TItem, TVariables, TResult> {
  /** Every cached list whose key starts with this one is edited. */
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TResult>;
  /** The list as it should look while the request is on its way. */
  optimistic: (items: TItem[], variables: TVariables) => TItem[];
  /**
   * The list once the API has answered, usually with the saved item swapped
   * in so its new version is the one the next change is based on.
   */
  confirmed: (items: TItem[], result: TResult, variables: TVariables) => TItem[];
}

type Snapshot<TItem> = [QueryKey, TItem[] | undefined][];

/**
 * A write that shows its result at once and takes it back if the API refuses.
 *
 * The cached lists are changed before the request is sent. On success they
 * are corrected with the server's answer; on failure they are restored and
 * then refetched, so what is on screen is what the server has, which matters
 * most when the failure was that someone else changed the same item.
 */
export function useOptimisticListMutation<TItem, TVariables, TResult = void>({
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
    mutationFn,
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
