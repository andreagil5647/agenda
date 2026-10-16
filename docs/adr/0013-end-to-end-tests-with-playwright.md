# 0013. End-to-end tests with Playwright, against the real API

- Status: Accepted
- Date: 2026-10-14

## Context

The component tests run in jsdom against an in-memory fake of the API. That is fast and it is the
right place for behaviour, but there is a list of things it cannot see:

- Pointer drags, because jsdom lays nothing out: dragging a task onto the grid, moving a block and
  pulling its edge were only ever checked by hand.
- What a real browser does with the page before the app starts: the script that puts the theme on
  the page, the browser bar colour, view transitions, real animations and `prefers-reduced-motion`.
- Layout, such as a screen that scrolls sideways at phone width in one of four themes.
- The real server: cookies, the CSRF header, `If-Match` and the contract, which the fake only
  imitates.

The first run of these tests found a bug the component tests could not: adding a task while the
list was still loading left it on "Loading tasks..." for good, because the shared write helper
cancelled the first load of the list and nothing asked for it again.

## Options considered

- **Cypress**: runs inside the browser with its own runner. Events are simulated by default, so a
  real pointer drag needs a plugin, and it works in a single tab with limits on origins.
- **WebdriverIO or Selenium**: more setup for what is needed here, and no built-in way to emulate
  media features such as reduced motion.
- **Playwright** (chosen): drives the browser with real input events, waits for what it needs,
  emulates reduced motion, locale and time zone per test, keeps a trace of a failure, and is
  written in TypeScript. The cost is one development dependency and a browser download of about
  120 MB.

For what the tests talk to:

- **A faked network in the browser**: no database to run, but it cannot see cookies, CSRF,
  versions or a contract that has drifted, and the component tests already cover the app against a
  fake.
- **The deployed API**: nothing to run, but cold starts, shared state and the demo's rate limit
  against something other people use.
- **The real API, run from its own repository with its own database** (chosen).

## Decision

- Playwright, with Chromium only for now, in `e2e/`. `pnpm run test:e2e` runs it. Jest ignores the
  folder.
- The tests run against the real API. Locally that is the one the dev server already proxies to;
  the dev server itself is started if it is not running. In CI a second job checks out the API's
  `develop` branch next to this repository, builds it, and starts it against a MongoDB container.
  A change that needs a new API merges in the API repository first.
- **A few journeys, not a copy of the component tests.** Planning with the pointer (add a task and
  reload, drag a task onto the grid, move a block and pull its edge, reload); the theme and the
  language on the page before the app has loaded, and what the list and the button do; finishing a
  task, with real animations and with reduced motion; and every theme at phone width.
- **One demo account per run.** A setup step opens a demo account and saves its session; the
  signed-in tests reuse it, one after another, each with titles of its own or seeded items of its
  own. A demo sign-in is limited to 20 per address per window, and a demo account is deleted after
  a day, so a developer's database is not left with accounts that stay. The visitor tests need no
  account.
- A test waits for the planner to have loaded before it acts, as a person does, and the language,
  time zone and window size are fixed, so the same test means the same thing on any machine.
- The dev server's overlay covers the page for errors only, not for compiler warnings, which
  would otherwise sit over a working app and turn a click into a confusing timeout.

## Consequences

- A run takes about a minute, against about fifteen seconds for the component tests, so it is not
  part of the commit hook. It is a separate job in CI and a script to run before a pull request
  that touches the planner.
- The suite checks the dev server, which is what developers use. It does not check the production
  build; serving `dist` with the `/api` rewrite would, at the cost of a small static server, and
  is worth doing before a release.
- CI depends on the API's `develop` branch, so a broken API fails this repository's check. That
  is the point of running against it, and the price of two repositories.
- Tests that pass for the wrong reason are a real risk: the first draft of the reduced-motion test
  passed with the rule it guards removed, because a burst that is not shown is also gone by the
  time a test looks. The tests are checked by breaking what they guard and watching them fail.
- Accessibility checks with axe can run in this suite later, on the same pages. Firefox and
  WebKit are one line each in the config, and a decision about how long a run may take.
