# 0007. TanStack Query for server state

- Status: Accepted
- Date: 2026-10-12

## Context

The planner dashboard fetched calendars, tasks and events in one effect, kept them in one
`useState`, and reloaded all three after every write. That was already wrong in small ways:
a write blocked the screen until three requests came back, two quick changes to the same task
raced each other, and a failed change left the screen showing something the server did not have.

The time grid makes this much harder. Dragging a block has to move it under the pointer at
once, send the change, and put the block back if the API refuses, including the case where the
API refuses because the block changed in another tab (`412`, see the backend's ADR 0006). The
same event is on screen in more than one cached range, and every saved resource comes back with
a new `version` that the next change has to be based on.

## Options considered

- **Hand-written hooks** (`useEffect` plus `useState` per resource): no dependency, but caching,
  request de-duplication, cancellation, refetch on focus, retry and optimistic rollback each
  have to be written and tested here. That is a small library, built as a side effect.
- **A global store** (Redux Toolkit, Zustand) holding server data: good for client state, but
  it treats fetched data as something the client owns, and leaves staleness and rollback to us.
- **RTK Query**: solves the same problem well, and brings Redux with it, which nothing else in
  the app needs.
- **SWR**: small and close in spirit, with a thinner mutation and optimistic-update model.
- **TanStack Query**: a cache keyed by query, with cancellation, invalidation and mutation
  lifecycle hooks (`onMutate`, `onError`, `onSuccess`) that map directly onto
  "apply, send, confirm or roll back".

## Decision

Use TanStack Query as the only place server data lives.

- Requests are plain functions in each feature's `api/` folder. Hooks in `hooks/` wrap them:
  `useTasks`, `useUpdateTask`, and so on. Components call hooks; they never call the API client.
- Every write goes through `useOptimisticListMutation` (`src/lib/query`). It edits the cached
  lists before the request is sent, swaps in the saved resource when the API answers, and on
  failure restores the lists and refetches them, so the screen ends on what the server has.
- One `QueryClient` exists per signed-in session. It is created when the planner mounts and
  discarded on sign-out, so nothing cached for one account can be shown to the next.
- Failures have one route out of the cache: a write that could not be saved becomes a notice, a
  `401` on any request ends the session, and a failed read is shown by the panel that asked for
  it, with a way to try again.
- Only requests that never reached the server are retried, once. An error the API answered with
  would be the same on a second attempt.

## Consequences

- Optimistic updates with rollback are a few lines per resource, and the rule for them is
  written once.
- Client-only state (the selected day, an open dialog) stays in components and hooks. There is
  no global store, and adding one would need its own reason.
- It adds to the bundle. With the other libraries the planner needs (drag and drop, the typed
  API client), third-party code outside React measures 27 kB gzipped in the production build.
- Query keys are a convention, not a type: a mistyped key is a cache miss, not a build error.
  Each feature keeps its keys next to its hooks to keep them in one place.
- The cache is in memory only. A reload starts empty, which is right for data that other
  devices can change.
