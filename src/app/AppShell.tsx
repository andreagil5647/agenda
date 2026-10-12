import type { JSX, ReactNode } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { AuthUser } from '../lib/api/contract';
import { env } from '../lib/env';
import controls from '../ui/controls.module.css';
import styles from './AppShell.module.css';

interface AppShellProps {
  user: AuthUser;
  children: ReactNode;
}

/** The frame around every signed-in screen: who is signed in, and the way out. */
export function AppShell({ user, children }: AppShellProps): JSX.Element {
  const { logOut, error } = useAuth();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Account">
        <p className={styles.brand}>Agenda</p>
        <div className={styles.account}>
          <p className={styles.name}>{user.displayName}</p>
          {user.isDemo && (
            <p className={styles.demoNote}>Demo account. It is deleted after a day.</p>
          )}
          <button type="button" className={controls.secondaryAction} onClick={() => void logOut()}>
            Log out
          </button>
        </div>
        <p className={styles.version}>web {env.appVersion}</p>
      </aside>

      <main className={styles.workspace}>
        {error && (
          <p className={controls.formError} role="alert">
            {error}
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
