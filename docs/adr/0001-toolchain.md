# 0001. Same toolchain conventions as the backend

- Status: Accepted
- Date: 2026-09-28

## Context

The two repositories are developed together and should read as one project, not as two
teams' unrelated habits. Versions below were checked on npm on 2026-09-28.

## Decision

- **TypeScript 6.0**, not 7.0, for the same reason as the backend: typescript-eslint 8.71
  supports `typescript <6.1`. Revisit both repos together when that changes.
- **ESLint 9**, not 10. Here the constraint is different from the backend's: it is not
  typescript-eslint but `eslint-plugin-jsx-a11y` 6.10, whose peer range tops out at
  ESLint 9. The backend has no such plugin and stays on ESLint 10.
- **React 19**, function components with hooks only, no class components.
- **Husky, commitlint, lint-staged**: identical configuration to the backend, so a
  contributor moving between repos finds the same hooks and the same commit rules.
- **Node 22** (`.node-version`), matching the backend.

## Consequences

- The two repos' ESLint majors differ by one version for a documented reason; this is not
  an oversight and does not need reconciling.
- When typescript-eslint adds TypeScript 7 support, upgrade both repos' TypeScript in the
  same change so they stay aligned.
