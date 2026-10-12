# 0005. pnpm for frontend package management

- Status: Accepted
- Date: 2026-10-08

## Context

The frontend started with npm and a committed `package-lock.json`. As the app grows, the
project benefits from faster installs, a stricter dependency layout, and one explicit
package-manager version that CI, Render and local contributors all use the same way.

## Options considered

- **Keep npm**: least churn, but keeps the larger npm lockfile and looser dependency layout.
- **Switch to pnpm**: faster installs, a compact lockfile, and strict dependency resolution.
- **Switch to Yarn**: mature and capable, but does not offer a clear advantage for this repo.

## Decision

Use pnpm 10 for the frontend. `package.json` declares `packageManager: pnpm@10.13.1`,
`pnpm-lock.yaml` is the only committed dependency lockfile, and local, CI, Render and Husky
commands use `pnpm`, `pnpm run` or `pnpm exec`.

## Consequences

- Contributors should install through pnpm, usually via Corepack on Node 22.
- CI and Render fail if `pnpm-lock.yaml` is stale.
- The frontend and backend may use different package managers for a while; commands stay
  explicit in each repo to avoid ambiguity.
