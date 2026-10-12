import type { JSX } from 'react';
import { useServerStatus } from '../lib/serverStatus/useServerStatus';
import { env } from '../lib/env';

const STATUS_COPY: Record<string, string> = {
  checking: 'Checking the API…',
  ready: 'API is up.',
  waking: 'Waking up the server. Free hosting sleeps when idle; this usually takes under a minute.',
  error: 'Could not reach the API. Try reloading in a moment.',
};

/**
 * Placeholder root, standing in until the router and design system land.
 * Its job right now is to prove the deployment shape end to end: same-origin
 * /api/* through the static site's rewrite, and the cold-start UX from
 * ADR 0003 / docs/adr backend repo.
 */
export function App(): JSX.Element {
  const { status, elapsedMs } = useServerStatus();

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 480 }}>
      <h1>Agenda</h1>
      <p>Calendar and task planner, built around time-blocking.</p>
      <p role="status" aria-live="polite">
        {STATUS_COPY[status]}
        {status !== 'ready' && ` (${String(Math.round(elapsedMs / 1000))}s)`}
      </p>
      <p style={{ color: '#666', fontSize: '0.85rem' }}>
        web {env.appVersion} · api base {env.apiBaseUrl}
      </p>
    </main>
  );
}
