import type { JSX, ReactNode } from 'react';
import { AuthScreen } from '../features/auth/components/AuthScreen';
import { AuthProvider, useAuth } from '../features/auth/hooks/useAuth';
import { useServerStatus, type ServerStatus } from '../lib/serverStatus/useServerStatus';
import { Logo } from '../ui/Logo';
import { NoticeProvider } from '../ui/notices/NoticeProvider';
import styles from './App.module.css';
import { AppShell } from './AppShell';
import { PlannerPage } from './PlannerPage';
import { PlannerQueryProvider } from './PlannerQueryProvider';

const STATUS_COPY: Record<ServerStatus, string> = {
  checking: 'Checking the API...',
  ready: 'API is up.',
  waking: 'Waking up the server. Free hosting sleeps when idle; this usually takes under a minute.',
  error: 'Could not reach the API. Try reloading in a moment.',
};

/** Holds the app back until the API answers, which on free hosting can take a minute. */
function ServerGate({ children }: { children: JSX.Element }): JSX.Element {
  const { status, elapsedMs } = useServerStatus();

  if (status === 'ready') {
    return children;
  }

  return (
    <StatusScreen title="Getting your planner ready.">
      <p role="status" aria-live="polite">
        {STATUS_COPY[status]} ({String(Math.round(elapsedMs / 1000))}s)
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

  if (status === 'loading') {
    return (
      <StatusScreen title="Welcome back.">
        <p role="status" aria-live="polite">
          Loading your session...
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
    <ServerGate>
      <NoticeProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </NoticeProvider>
    </ServerGate>
  );
}
