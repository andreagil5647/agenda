import type { JSX } from 'react';
import { AuthScreen } from '../features/auth/AuthScreen';
import { PlannerDashboard } from '../features/planner/PlannerDashboard';
import { AuthProvider, useAuth } from '../lib/auth/AuthContext';
import { env } from '../lib/env';
import { useServerStatus, type ServerStatus } from '../lib/serverStatus/useServerStatus';
import controls from '../ui/controls.module.css';
import styles from './App.module.css';

const STATUS_COPY: Record<ServerStatus, string> = {
  checking: 'Checking the API...',
  ready: 'API is up.',
  waking: 'Waking up the server. Free hosting sleeps when idle; this usually takes under a minute.',
  error: 'Could not reach the API. Try reloading in a moment.',
};

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

function AppShell(): JSX.Element {
  const { session, logout, error } = useAuth();
  const user = session?.user;

  return (
    <main className={styles.appShell}>
      <aside className={styles.sidebar} aria-label="Workspace navigation">
        <div>
          <p className={styles.brand}>Agenda</p>
          <nav className={styles.nav}>
            <a href="#today" aria-current="page">
              Today
            </a>
            <a href="#tasks">Tasks</a>
            <a href="#calendars">Calendars</a>
          </nav>
        </div>
        <p className={styles.version}>web {env.appVersion}</p>
      </aside>

      <section className={styles.workspace} id="today">
        <header className={styles.topbar}>
          <div>
            <p className={controls.eyebrow}>Signed in</p>
            <h1>{user?.displayName}</h1>
          </div>
          <button type="button" className={controls.secondaryAction} onClick={() => void logout()}>
            Log out
          </button>
        </header>

        {error && (
          <p className={controls.formError} role="alert">
            {error}
          </p>
        )}

        <PlannerDashboard />
      </section>
    </main>
  );
}

function AuthGate(): JSX.Element {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <main className={styles.statusScreen}>
        <p role="status" aria-live="polite">
          Loading your session...
        </p>
      </main>
    );
  }

  return status === 'authenticated' ? <AppShell /> : <AuthScreen />;
}

export function App(): JSX.Element {
  return (
    <ServerGate>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ServerGate>
  );
}
