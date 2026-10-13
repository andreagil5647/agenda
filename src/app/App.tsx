import type { JSX } from 'react';
import { AuthScreen } from '../features/auth/components/AuthScreen';
import { AuthProvider, useAuth } from '../features/auth/hooks/useAuth';
import { useServerStatus, type ServerStatus } from '../lib/serverStatus/useServerStatus';
import controls from '../ui/controls.module.css';
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
    <main className={styles.statusScreen}>
      <div>
        <p className={controls.eyebrow}>Agenda</p>
        <h1>Preparing your planner.</h1>
        <p role="status" aria-live="polite">
          {STATUS_COPY[status]} ({String(Math.round(elapsedMs / 1000))}s)
        </p>
      </div>
    </main>
  );
}

/** Shows the planner to a signed-in user and the sign-in screen to everyone else. */
function AuthGate(): JSX.Element {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <main className={styles.statusScreen}>
        <p role="status" aria-live="polite">
          Loading your session...
        </p>
      </main>
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
