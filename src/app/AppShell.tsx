import type { JSX, ReactNode } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { AuthUser } from '../lib/api/contract';
import { env } from '../lib/env';
import { useI18n } from '../lib/i18n/I18nProvider';
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
  const { t } = useI18n();

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        {t('shell.skipLink')}
      </a>

      <aside className={styles.sidebar} aria-label={t('shell.account')}>
        <div className={styles.brand}>
          <Logo size={36} />
          <span>{t('brand.name')}</span>
        </div>

        <div className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">
            {initialOf(user.displayName)}
          </span>
          <p className={styles.name}>{user.displayName}</p>
          {user.isDemo && <p className={styles.demoNote}>{t('shell.demoNote')}</p>}
          <button type="button" className={controls.secondaryAction} onClick={() => void logOut()}>
            {t('shell.logOut')}
          </button>
        </div>

        <p className={styles.version}>{t('shell.version', { version: env.appVersion })}</p>
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
