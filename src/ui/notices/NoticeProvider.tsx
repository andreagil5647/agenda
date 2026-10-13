import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import styles from './NoticeProvider.module.css';

interface Notice {
  id: number;
  message: string;
}

type Notify = (message: string) => void;

const MAX_VISIBLE_NOTICES = 3;

const NoticeContext = createContext<Notify | undefined>(undefined);

/**
 * One place for problems that are not tied to a field or a panel, such as a
 * change that could not be saved. A notice stays until it is dismissed: an
 * error that disappears on a timer is easy to miss, and impossible to re-read.
 */
export function NoticeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);

  const notify = useCallback<Notify>((message) => {
    setNotices((current) => {
      const others = current.filter((notice) => notice.message !== message);
      const notice = { id: nextId.current, message };
      nextId.current += 1;
      return [...others, notice].slice(-MAX_VISIBLE_NOTICES);
    });
  }, []);

  const dismiss = useCallback((id: number) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const value = useMemo(() => notify, [notify]);

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div className={styles.notices}>
        {notices.map((notice) => (
          <div key={notice.id} className={styles.notice} role="alert">
            <p>{notice.message}</p>
            <button
              type="button"
              className={styles.dismiss}
              onClick={() => {
                dismiss(notice.id);
              }}
            >
              Dismiss
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
