import type { JSX, ReactNode } from 'react';
import { AuthScreen } from '../features/auth/components/AuthScreen';
import { AuthProvider, useAuth } from '../features/auth/hooks/useAuth';
import type { PlainMessageKey } from '../lib/i18n/catalogues';
import { I18nProvider, useI18n } from '../lib/i18n/I18nProvider';
import { useServerStatus, type ServerStatus } from '../lib/serverStatus/useServerStatus';
import { Dock } from '../ui/dock/Dock';
import { Logo } from '../ui/Logo';
import { NoticeProvider } from '../ui/notices/NoticeProvider';
import styles from './App.module.css';
import { AppShell } from './AppShell';
import { PlannerPage } from './PlannerPage';
import { PlannerQueryProvider } from './PlannerQueryProvider';

const STATUS_MESSAGES = {
  checking: 'app.status.checking',
  ready: 'app.status.ready',
  waking: 'app.status.waking',
  error: 'app.status.error',
} as const satisfies Record<ServerStatus, PlainMessageKey>;

/** Holds the app back until the API answers, which on free hosting can take a minute. */
function ServerGate({ children }: { children: JSX.Element }): JSX.Element {
  const { status, elapsedMs } = useServerStatus();
  const { t } = useI18n();

  if (status === 'ready') {
    return children;
  }

  return (
    <StatusScreen title={t('app.loading.title')}>
      <p role="status" aria-live="polite">
        {t('app.status.elapsed', {
          message: t(STATUS_MESSAGES[status]),
          seconds: Math.round(elapsedMs / 1000),
        })}
      </p>
    </StatusScreen>
  );
}

/** What is shown while the app is not ready to be used: the brand, a heading and what is going on. */
function StatusScreen({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <main className={styles.statusScreen}>
      <div className={styles.status}>
        <Logo size={64} />
        <h1>{title}</h1>
        {children}
        <div className={styles.loader} aria-hidden="true">
          <span data-calendar-color="blue" />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}

/** Shows the planner to a signed-in user and the sign-in screen to everyone else. */
function AuthGate(): JSX.Element {
  const { status, user } = useAuth();
  const { t } = useI18n();

  if (status === 'loading') {
    return (
      <StatusScreen title={t('app.session.title')}>
        <p role="status" aria-live="polite">
          {t('app.session.loading')}
        </p>
      </StatusScreen>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <AppShell user={user}>
      <PlannerQueryProvider>
        <PlannerPage settings={user.settings} />
      </PlannerQueryProvider>
    </AppShell>
  );
}

export function App(): JSX.Element {
  return (
    <I18nProvider>
      <ServerGate>
        <NoticeProvider>
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
        </NoticeProvider>
      </ServerGate>
      <Dock />
    </I18nProvider>
  );
}
