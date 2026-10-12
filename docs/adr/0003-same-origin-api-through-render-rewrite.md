# 0003. Same-origin API through the static site's rewrite

- Status: Accepted
- Date: 2026-09-28

## Context

This mirrors the backend repo's `docs/adr/0003-same-origin-api-through-render-rewrite.md`
in full; see it for the reasoning (`onrender.com` on the Public Suffix List, third-party
cookies blocked on Safari/iOS, why a rewrite fixes it). This record covers only the
frontend-specific half of the decision.

## Decision

- The API is always called with a relative base URL (`PUBLIC_API_BASE_URL=/api/v1`), never
  an absolute `https://agenda-backend.onrender.com/...` URL. This is the same value in
  development and production, which is what lets the same code path be exercised by
  `useServerStatus` locally and once deployed.
- In development, `webpack-dev-server`'s proxy forwards `/api/*` to
  `http://localhost:4000`, mirroring the Render static-site rewrite in shape (see
  `config/webpack/webpack.dev.ts`). This was verified locally against the running backend
  before writing any further app code, since it is the riskiest single assumption in the
  whole architecture.
- In production, `render.yaml`'s `routes` rewrite `/api/*` to the backend service, listed
  before the SPA fallback rewrite (order matters: Render evaluates routes in order, and the
  fallback would otherwise swallow every API request and return `index.html`).

## Consequences

- The actual Render deployment - the other half of this same spike - still needs to be
  done once both repos are pushed and connected to Render services, to confirm the
  static-site rewrite behaves the same way for a real cookie response (headers, timing
  during a cold start) as the dev-server proxy does locally. Until then, this ADR reflects
  the design and the local half of the evidence, not a deployed confirmation.
- If the rewrite were removed, no code change would be needed to fail _loudly_: relative
  `/api/*` requests would simply 404 against the static site instead of silently hitting
  the wrong origin.
