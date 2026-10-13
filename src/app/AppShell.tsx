import type { JSX, ReactNode } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { AuthUser } from '../lib/api/contract';
import { env } from '../lib/env';
import controls from '../ui/controls.module.css';
import { Logo } from '../ui/Logo';
import styles from './AppShell.module.css';

interface AppShellProps {
  user: AuthUser;
  children: ReactNode;
}

/** The first letter of a name, for the avatar. Counts letters, not UTF-16 units. */
function initialOf(name: string): string {
  return (Array.from(name.trim())[0] ?? '?').toUpperCase();
}

/** The frame around every signed-in screen: who is signed in, and the way out. */
export function AppShell({ user, children }: AppShellProps): JSX.Element {
  const { logOut, error } = useAuth();

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to the planner
      </a>

      <aside className={styles.sidebar} aria-label="Account">
        <div className={styles.brand}>
          <Logo size={36} />
          <span>Agenda</span>
        </div>

        <div className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">
            {initialOf(user.displayName)}
          </span>
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

      <main id="main" tabIndex={-1} className={styles.workspace}>
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
