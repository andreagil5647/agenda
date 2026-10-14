# 0003. Adding a task while the list was loading left it on "Loading tasks..." for good

- Date found: 2026-10-14
- Area: data layer (`useOptimisticListMutation`)
- Fixed in: `fix: read a list again after a write that arrived while it was still loading`

## Symptom

On a slow first load, a task added before the list had arrived was saved, but the tasks panel
stayed on "Loading tasks..." and never showed the list again until the page was reloaded. The
same would happen to the calendars panel, which uses the same code.

Nothing was reported: no error, no notice, and nothing in the console.

## Reproduction

Open the planner and add a task as soon as the form appears, before the list has loaded. By
hand that needs a slow connection; a script that fills the form and presses the button the moment
`Loading tasks...` is on screen does it every time:

1. Sign in and reload.
2. While the panel says `Loading tasks...`, fill in "New task" and press "Add task".
3. The task is created (`POST /tasks` answers 201), and the panel is stuck.

## Investigation

It was found by the first run of the end-to-end tests ([ADR 0013](../adr/0013-end-to-end-tests-with-playwright.md)),
which typed into the form straight after opening the page. The failure looked like a slow test:
the task never appeared, with the page snapshot showing `status: Loading tasks...`.

1. **A slow API?** The network log of the failing run had the answer for `GET /tasks` 90 ms after
   it was asked, long before the test gave up. Not slow.
2. **A failed write?** `POST /tasks` answered 201. Not that either.
3. **What did the app ask for afterwards?** Nothing. The log showed `GET /tasks`, then
   `POST /tasks`, then silence: no second read to bring the new task in.

The shared write helper cancels reads in flight before it edits the cached list, so that a
late answer cannot overwrite the edit. That is what was left to look at.

## Root cause

`cancelQueries` puts a query back to the state it was in before the fetch began. For a list that
already has data that is harmless, because the data is still there. For a list that is being
loaded for the first time, the state before the fetch is "pending, with no data and nothing
fetching", which is the loading screen. Nothing starts a new fetch from that state: the page had
already asked once, and the write's own code skips a list with no data, so the answer to the
first read was thrown away and nobody asked again.

The new task was never merged into the list either, for the same reason, but the list was not
there to show it.

## Fix

The helper now notes which lists had nothing to show when the write began, and once the write is
done it reads exactly those again. A list that already had data behaves as before.

The first idea was the opposite: leave a first load alone and read the list again when the write
is done. It does not work, and a failing test showed why: a refetch of a list that is in the
middle of its first fetch does not start a new one. TanStack Query hands back the request that is
already in flight, so the list would show the answer that predates the write. Cancelling first
leaves nothing in flight to join.

## Regression guard

[`src/app/WriteWhileLoading.test.tsx`](../../src/app/WriteWhileLoading.test.tsx) holds the first
read of the list open, adds an item through the UI, and then lets the read go, in the two orders
that can happen: an answer that was read before the write and one read after it. It does the same
for calendars. All three fail on the code before the fix.

## Takeaway

A test that answers instantly cannot see a bug that needs two things to be in flight at once.
The component tests answer every request at once; the first test that ran in a real browser
against a real server found it in a minute. When code cancels or reorders requests, the test
needs a way to hold one open.
