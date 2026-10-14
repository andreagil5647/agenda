import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import type { AppTranslate } from '../../lib/i18n/catalogues';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './NoticeProvider.module.css';

/**
 * The text of a notice, written when it is shown and not when it is raised,
 * so a notice that is still on screen follows a change of language.
 */
export type NoticeText = (t: AppTranslate) => string;

interface Notice {
  id: number;
  text: NoticeText;
}

type Notify = (text: NoticeText) => void;

const MAX_VISIBLE_NOTICES = 3;
/** What is remembered: more than is shown, so dismissing one can bring an older one back. */
const MAX_KEPT_NOTICES = 20;

const NoticeContext = createContext<Notify | undefined>(undefined);

/**
 * One place for problems that are not tied to a field or a panel, such as a
 * change that could not be saved. A notice stays until it is dismissed: an
 * error that disappears on a timer is easy to miss, and impossible to re-read.
 * The same sentence is shown once, however many times it is raised.
 */
export function NoticeProvider({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useI18n();
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);

  const notify = useCallback<Notify>((text) => {
    setNotices((current) => {
      const notice = { id: nextId.current, text };
      nextId.current += 1;
      return [...current, notice].slice(-MAX_KEPT_NOTICES);
    });
  }, []);

  const messages = notices.map((notice) => ({ id: notice.id, message: notice.text(t) }));
  const shown = messages
    .filter(({ message }, index) => messages.findLastIndex((m) => m.message === message) === index)
    .slice(-MAX_VISIBLE_NOTICES);

  const dismiss = (message: string): void => {
    setNotices((current) => current.filter((notice) => notice.text(t) !== message));
  };

  return (
    <NoticeContext.Provider value={notify}>
      {children}
      <div className={styles.notices}>
        {shown.map(({ id, message }) => (
          <div key={id} className={styles.notice} role="alert">
            <p>{message}</p>
            <button
              type="button"
              className={styles.dismiss}
              onClick={() => {
                dismiss(message);
              }}
            >
              {t('notice.dismiss')}
            </button>
          </div>
        ))}
      </div>
    </NoticeContext.Provider>
  );
}

export function useNotify(): Notify {
  const notify = useContext(NoticeContext);
  if (!notify) {
    throw new Error('useNotify must be used inside NoticeProvider');
  }
  return notify;
}
