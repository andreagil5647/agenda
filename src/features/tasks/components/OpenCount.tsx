import { useState, type JSX } from 'react';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import styles from './OpenCount.module.css';

interface OpenCountProps {
  /** How many tasks are open, or undefined while the list is still loading. */
  count: number | undefined;
  /** How many times the reader has finished, added or deleted a task: it goes up with each. */
  readerActions: number;
}

interface Shown {
  count: number | undefined;
  /** How many of the reader's actions the number on screen already accounts for. */
  actionsAccountedFor: number;
  /** Which way the count went, when it went there because of something the reader did. */
  tick: 'down' | 'up' | null;
}

/**
 * How many tasks are open. When something the reader did moves the number, the new one rolls in
 * from the side it came from, which is the feedback for finishing, adding or deleting a task. A
 * number that arrives with the list, or because the list changed somewhere else, just appears.
 *
 * The reader's actions are counted as they are made, and not guessed from whether a request is
 * on its way: with a fast API the request is over before anything is drawn.
 */
export function OpenCount({ count, readerActions }: OpenCountProps): JSX.Element | null {
  const { t } = useI18n();
  const [shown, setShown] = useState<Shown>({
    count,
    actionsAccountedFor: readerActions,
    tick: null,
  });

  // Adjusted while rendering, which is how React keeps state in step with a prop.
  if (shown.count !== count) {
    let tick: Shown['tick'] = null;
    const isFromReader = readerActions > shown.actionsAccountedFor;
    if (isFromReader && shown.count !== undefined && count !== undefined) {
      tick = count < shown.count ? 'down' : 'up';
    }
    setShown({ count, actionsAccountedFor: readerActions, tick });
  }

  if (count === undefined) return null;

  // Keyed by the number, so that each new one is a new element and its animation starts over.
  return (
    <span key={count} className={styles.count} data-tick={shown.tick ?? undefined}>
      {t('tasks.openCount', { count })}
    </span>
  );
}
