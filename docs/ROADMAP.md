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
- [x] Day planner: calendars, a task list and the selected day on an hour grid
- [x] Visual identity: a paper planner look in light and dark, self-hosted fonts, and a test
      that holds every colour pair to WCAG AA ([ADR 0009](adr/0009-visual-identity.md))

Known gaps in the done items:

- [ ] The pointer paths of dragging are checked by hand; only the keyboard paths and the
      arithmetic have automated tests
- [ ] Deleting a task, block or calendar has no undo. An undo notice is better than a
      confirmation dialog, and needs a restore endpoint for events
- [ ] The quick-add forms label their fields with a placeholder and an accessible name rather
      than a visible label
- [ ] The theme follows the system; there is no switch until the settings screen exists
- [ ] The app has one screen: no routes, and no settings screen for the time zone, hour
      cycle or theme, which are fixed when the account is created

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
- [x] **Feature split.** `calendars`, `tasks` and `timeline` features with their own
      components and hooks; date helpers in `lib/time` with unit tests.
- [x] **Test network layer.** MSW handlers instead of order-based `fetch` mocks, and a
      coverage threshold in CI.
- [ ] **Routing and settings.** Day, Week, Tasks and Settings routes; a settings screen for
      time zone, week start, hour cycle and theme.
- [ ] **UI primitives.** Button, Input, Dialog and Toast with consistent focus and error
      states.

### 2. Time-blocking

- [x] **Day grid.** Hour grid, all-day row, current-time line, blocks positioned by time,
      overlapping blocks side by side. Layout maths is pure and unit-tested.
- [x] **Create a block** by clicking empty grid space or with the Add block button, then
      edit its title, calendar and times in the details panel.
- [ ] **Create a block by dragging** over empty grid space to set its length.
- [x] **Task onto the grid.** Dragging a task creates a linked block as long as the task's
      estimate, optimistically, with rollback on failure. The Plan button does the same from
      the keyboard ([ADR 0008](adr/0008-drag-and-drop-with-dnd-kit.md)).
- [x] **Move and resize** blocks with 15-minute snapping, and a clear message when the
      server reports a newer version.
- [x] **Keyboard planning.** Every drag action has a keyboard equivalent and is announced
      to screen readers: Plan on a task, arrow keys and Shift with arrow keys on a block.
- [ ] **Touch dragging.** A block is picked up as soon as it is touched, so the grid only
      scrolls from empty space. Pick it up on a long press instead.
- [ ] **Reorder tasks** by dragging in the list.
- [ ] **Edit and delete calendars**, and hide a calendar's blocks.
- [ ] **Week grid** reusing the day column.

### Languages, themes, motion and sound

- [ ] **Languages.** The whole app in English and Spanish, switchable at any time, with
      dates and numbers in the language's own form. The runtime and the typed catalogue are
      in ([ADR 0010](adr/0010-typed-message-catalogue.md)); the screens move over one area
      at a time.
- [ ] **Themes.** Several complete looks, light and dark, switched from the corner of the
      screen with an animated change.
- [ ] **Motion.** Feedback for finishing a task, dropping a block and changing day.
- [ ] **Sound.** Short synthesised cues in the style of the current theme, off by default.

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
