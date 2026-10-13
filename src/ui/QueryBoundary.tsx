import type { UseQueryResult } from '@tanstack/react-query';
import type { JSX, ReactNode } from 'react';
import { describeError } from '../lib/api/errorMessages';
import controls from './controls.module.css';
import styles from './QueryBoundary.module.css';

interface QueryBoundaryProps<TData> {
  query: UseQueryResult<TData>;
  /** Announced while the first load is in progress, such as "Loading tasks". */
  loadingLabel: string;
  children: (data: TData) => ReactNode;
}

/**
 * The states every read can be in, handled the same way everywhere: loading,
 * failed with a way to try again, and loaded. Data that could not be
 * refreshed is still shown, with a note that it may be out of date.
 */
export function QueryBoundary<TData>({
  query,
  loadingLabel,
  children,
}: QueryBoundaryProps<TData>): JSX.Element {
  const retry = (): void => {
    void query.refetch();
  };

  if (query.data === undefined) {
    return query.isError ? (
      <div className={controls.formError} role="alert">
        <p className={styles.message}>{describeError(query.error)}</p>
        <button type="button" className={controls.secondaryAction} onClick={retry}>
          Try again
        </button>
      </div>
    ) : (
      <p role="status" aria-live="polite" className={styles.loading}>
        {loadingLabel}
      </p>
    );
  }

  return (
    <>
      {query.isError && (
        <p className={styles.stale} role="status">
          This could not be refreshed and may be out of date.{' '}
          <button type="button" className={styles.inlineAction} onClick={retry}>
            Try again
          </button>
        </p>
      )}
      {children(query.data)}
    </>
  );
}
