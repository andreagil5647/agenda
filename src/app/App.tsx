import type { JSX } from 'react';
import { AuthScreen } from '../features/auth/AuthScreen';
import { PlannerDashboard } from '../features/planner/PlannerDashboard';
import { AuthProvider, useAuth } from '../lib/auth/AuthContext';
import { env } from '../lib/env';
import { useServerStatus, type ServerStatus } from '../lib/serverStatus/useServerStatus';

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
    <main className="status-screen">
      <div>
        <p className="eyebrow">Agenda</p>
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
    <main className="app-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div>
          <p className="brand">Agenda</p>
          <nav>
            <a href="#today" aria-current="page">
              Today
            </a>
            <a href="#tasks">Tasks</a>
            <a href="#calendars">Calendars</a>
          </nav>
        </div>
        <p className="version">web {env.appVersion}</p>
      </aside>

      <section className="workspace" id="today">
        <header className="topbar">
          <div>
            <p className="eyebrow">Signed in</p>
            <h1>{user?.displayName}</h1>
          </div>
          <button type="button" className="secondary-action" onClick={() => void logout()}>
            Log out
          </button>
        </header>

        {error && (
          <p className="form-error" role="alert">
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
      <main className="status-screen">
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
    <>
      <style>{APP_STYLES}</style>
      <ServerGate>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ServerGate>
    </>
  );
}

const APP_STYLES = `
  :root {
    color: #17202a;
    background: #f6f7f9;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  button,
  input,
  select {
    font: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .status-screen,
  .auth-layout,
  .app-shell {
    min-height: 100vh;
  }

  .status-screen {
    display: grid;
    place-items: center;
    padding: 24px;
    text-align: center;
  }

  .auth-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 440px);
    gap: 48px;
    align-items: center;
    max-width: 1120px;
    margin: 0 auto;
    padding: 48px 24px;
  }

  .auth-copy h1,
  .workspace h1,
  .status-screen h1 {
    margin: 0;
    font-size: 4rem;
    line-height: 0.96;
    letter-spacing: 0;
  }

  .auth-copy p:not(.eyebrow),
  .status-screen p:not(.eyebrow) {
    max-width: 620px;
    color: #59636f;
    font-size: 1.08rem;
    line-height: 1.7;
  }

  .auth-panel,
  .timeline-panel,
  .task-panel {
    border: 1px solid #d8dde4;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 20px 60px rgb(23 32 42 / 8%);
  }

  .auth-panel {
    padding: 24px;
  }

  .segmented {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-bottom: 24px;
    border-radius: 8px;
    background: #edf0f4;
    padding: 4px;
  }

  .segmented button {
    min-height: 40px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #59636f;
    cursor: pointer;
  }

  .segmented button.active {
    background: #ffffff;
    color: #17202a;
    box-shadow: 0 1px 4px rgb(23 32 42 / 14%);
  }

  form {
    display: grid;
    gap: 16px;
  }

  label {
    display: grid;
    gap: 8px;
    color: #344050;
    font-size: 0.92rem;
    font-weight: 650;
  }

  input {
    width: 100%;
    min-height: 44px;
    border: 1px solid #c9d0d9;
    border-radius: 6px;
    padding: 0 12px;
    color: #17202a;
    background: #ffffff;
  }

  select {
    width: 100%;
    min-height: 44px;
    border: 1px solid #c9d0d9;
    border-radius: 6px;
    padding: 0 12px;
    color: #17202a;
    background: #ffffff;
  }

  input:focus,
  select:focus {
    border-color: #2563eb;
    outline: 3px solid rgb(37 99 235 / 18%);
  }

  .primary-action,
  .secondary-action {
    min-height: 42px;
    border-radius: 6px;
    border: 1px solid transparent;
    padding: 0 16px;
    font-weight: 700;
    cursor: pointer;
  }

  .primary-action {
    background: #2563eb;
    color: #ffffff;
  }

  .primary-action:disabled {
    cursor: progress;
    opacity: 0.68;
  }

  .secondary-action {
    border-color: #c9d0d9;
    background: #ffffff;
    color: #17202a;
  }

  .icon-action {
    width: 34px;
    height: 34px;
    border: 1px solid #c9d0d9;
    border-radius: 6px;
    background: #ffffff;
    color: #59636f;
    cursor: pointer;
    font-weight: 800;
  }

  .checkbox-action {
    width: 22px;
    height: 22px;
    accent-color: #2563eb;
    cursor: pointer;
  }

  .form-error {
    margin: 0;
    border: 1px solid #f4b4b4;
    border-radius: 6px;
    background: #fff2f2;
    color: #9b1c1c;
    padding: 10px 12px;
  }

  .app-shell {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid #d8dde4;
    background: #ffffff;
    padding: 24px;
  }

  .brand {
    margin: 0 0 32px;
    font-size: 1.2rem;
    font-weight: 800;
  }

  nav {
    display: grid;
    gap: 8px;
  }

  nav a {
    border-radius: 6px;
    color: #59636f;
    padding: 10px 12px;
    font-weight: 650;
  }

  nav a[aria-current='page'] {
    background: #eaf1ff;
    color: #1746a2;
  }

  .version {
    margin: 0;
    color: #7b8591;
    font-size: 0.82rem;
  }

  .workspace {
    padding: 28px;
  }

  .topbar,
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .topbar {
    margin-bottom: 24px;
  }

  .workspace h1,
  .timeline-panel h2,
  .task-panel h2 {
    font-size: 1.8rem;
    line-height: 1.1;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #2563eb;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .planner-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.8fr);
    gap: 20px;
    align-items: start;
  }

  .timeline-panel,
  .task-panel,
  .calendar-panel {
    border: 1px solid #d8dde4;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 20px 60px rgb(23 32 42 / 8%);
    padding: 20px;
  }

  .side-stack {
    display: grid;
    gap: 20px;
  }

  .panel-header {
    margin-bottom: 18px;
  }

  .panel-header h2 {
    margin: 0;
  }

  .panel-header span,
  .timeline-row span,
  .task-list li,
  .empty-state {
    color: #59636f;
  }

  .date-control {
    min-width: 180px;
  }

  .timeline-list {
    display: grid;
    gap: 12px;
    margin-bottom: 18px;
  }

  .timeline-row {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    border-radius: 6px;
    background: #f6f7f9;
    padding: 14px;
  }

  .timeline-row strong,
  .timeline-row span {
    display: block;
  }

  .time {
    font-weight: 800;
    color: #1746a2;
  }

  .inline-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
  }

  .inline-form.compact {
    grid-template-columns: minmax(0, 1fr) minmax(110px, 0.55fr) auto;
  }

  .inline-form .primary-action {
    min-width: 110px;
  }

  .task-list {
    display: grid;
    gap: 10px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .task-list li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 10px;
    border-radius: 6px;
    background: #f6f7f9;
    padding: 10px;
  }

  .task-list li.done span {
    text-decoration: line-through;
  }

  .task-list small {
    color: #7b8591;
    font-weight: 700;
  }

  .calendar-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .calendar-pill {
    border-radius: 999px;
    background: #edf0f4;
    color: #344050;
    padding: 6px 10px;
    font-size: 0.86rem;
    font-weight: 750;
  }

  .calendar-pill.blue {
    background: #eaf1ff;
    color: #1746a2;
  }

  .calendar-pill.green {
    background: #e9f8ef;
    color: #19603a;
  }

  .calendar-pill.purple {
    background: #f1edff;
    color: #5333a3;
  }

  .calendar-pill.rose {
    background: #fff0f3;
    color: #9f1d3d;
  }

  @media (max-width: 760px) {
    .auth-layout,
    .app-shell,
    .planner-grid {
      grid-template-columns: 1fr;
    }

    .auth-layout {
      gap: 24px;
      padding: 32px 16px;
    }

    .sidebar {
      border-right: 0;
      border-bottom: 1px solid #d8dde4;
    }

    .workspace {
      padding: 20px 16px;
    }

    .topbar,
    .panel-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .inline-form,
    .inline-form.compact {
      grid-template-columns: 1fr;
    }

    .auth-copy h1,
    .workspace h1,
    .status-screen h1 {
      font-size: 2.4rem;
    }
  }
`;
