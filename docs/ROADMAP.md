# Roadmap

Ordered backlog for the web app. Each item is meant to be one branch and one pull request
into `develop`, ending in passing checks and, where a real decision was made, an ADR (see
[docs/adr](adr/README.md)).

The API ([andreagil5647/agenda-backend](https://github.com/andreagil5647/agenda-backend))
has its own [roadmap](https://github.com/andreagil5647/agenda-backend/blob/develop/docs/ROADMAP.md);
items here are ordered so the deployed app is always usable and each release adds something
visible.

## Status

Done:

- [x] Hand-written Webpack 5 build, TypeScript, linting, Jest, CI and the Render blueprint
- [x] Same-origin `/api/*` in development and production
      ([ADR 0003](adr/0003-same-origin-api-through-render-rewrite.md))
- [x] Cold-start aware server check ("waking up the server")
- [x] Sign up, log in, log out and a one-click demo session
- [x] Planner dashboard: calendars, a task list and the selected day's blocks, created and
      deleted through forms

Known gaps in the done items:

- [ ] `PlannerDashboard.tsx` mixes data fetching, state, date helpers, forms and rendering
- [ ] Blocks are listed, not laid out on a time grid, and nothing can be dragged yet

## Build order

### 1. Foundations

- [x] **CSS pipeline.** CSS Modules in the Webpack config, design tokens as custom
      properties, light and dark themes from the same tokens, all styles out of `App.tsx`
      ([ADR 0006](adr/0006-css-modules-and-design-tokens.md)).
- [x] **Generated API types.** Types generated from the backend's `openapi.json`, with a
      CI check that fails when they drift.
- [x] **API client.** The client owns the CSRF token and `If-Match` headers and returns
      typed errors, so callers stop passing the token around.
- [x] **Server-state layer.** One place for caching, refetching and optimistic updates;
      components never call the client directly
      ([ADR 0007](adr/0007-tanstack-query-for-server-state.md)).
- [ ] **Feature split.** `calendars`, `tasks` and `timeline` features with their own
      components and hooks; date helpers in `lib/time` with unit tests.
- [x] **Test network layer.** MSW handlers instead of order-based `fetch` mocks, and a
      coverage threshold in CI.
- [ ] **Routing and settings.** Day, Week, Tasks and Settings routes; a settings screen for
      time zone, week start, hour cycle and theme.
- [ ] **UI primitives.** Button, Input, Dialog and Toast with consistent focus and error
      states.

### 2. Time-blocking

- [ ] **Day grid.** Hour grid, all-day row, current-time line, blocks positioned by time,
      overlapping blocks side by side. Layout maths is pure and unit-tested.
- [ ] **Create a block** by clicking or dragging on empty grid space.
- [ ] **Task onto the grid.** Dragging a task creates a linked block as long as the task's
      estimate, optimistically, with rollback on failure.
- [ ] **Move and resize** blocks with 15-minute snapping, and a clear message when the
      server reports a newer version.
- [ ] **Reorder tasks** by dragging in the list.
- [ ] **Keyboard planning.** Every drag action has a keyboard equivalent and is announced
      to screen readers.
- [ ] **Week grid** reusing the day column.

### 3. Release quality

- [ ] End-to-end tests (Playwright) against the real API in CI
- [ ] Accessibility checks (axe) in component and end-to-end tests
- [ ] Route-level code splitting and a bundle budget in CI
- [ ] Empty, loading, error and offline states on every screen; responsive down to phone
      width

### 4. Recurring events

- [ ] Recurrence editor, and a "this / this and following / all" dialog when editing or
      deleting an occurrence. Expansion stays on the server.

### 5. Reminders

- [ ] Service worker, notification permission flow, installable PWA

## Definition of done, per item

- `pnpm run lint && pnpm run typecheck && pnpm test && pnpm run build` all pass.
- New behaviour has tests: unit tests for pure logic, component tests for UI.
- UI changes are checked in a browser, including with the keyboard.
- An ADR if the item involved a real trade-off; a debugging note only for a bug that
  actually happened.
- Small commits, conventional-commit messages, branch from `develop`.
