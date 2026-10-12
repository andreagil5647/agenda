# 0002. Retry-budget test flaked on the delay chain's last step

- Date found: 2026-09-28
- Area: testing (`useServerStatus`)
- Fixed in: `feat: add minimal app shell with a cold-start aware status check`

## Symptom

The test `gives up after the retry budget is exhausted` failed intermittently-looking, but
actually deterministically, at a fixed boundary:

```text
Expected: "error"
Received: "waking"
```

## Reproduction

```ts
jest.useFakeTimers({ advanceTimers: true });
global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
renderHook(() => useServerStatus());
await act(async () => {
  await jest.advanceTimersByTimeAsync(95_000);
});
// status was 'waking', not 'error'
```

## Investigation

`useServerStatus` retries on a fixed delay ladder (`500, 1000, 1500, 2500, 4000, 6000,
8000` ms, then repeating `8000`) up to a 90-second budget
(`GIVE_UP_AFTER_MS`). The test advanced fake time by 95 000 ms and expected the budget to
be exhausted by then. Working through the delay chain by hand (summing each scheduled
retry's fire time) showed the _check that finally observes_ `elapsed >= 90 000` does not
fire at exactly 90 000 ms - it fires whenever the next retry after crossing that mark
happens to land, which is up to one full step (8 000 ms) later. Summing the chain gives
that check landing at 95 500 ms, five hundred milliseconds after the window the test
advanced.

## Root cause

The test assumed `GIVE_UP_AFTER_MS` was itself the moment the hook would flip to `'error'`,
but the hook can only notice the budget is exhausted the next time a scheduled retry
actually runs - which, for a fixed delay ladder, can overshoot the budget by up to the
ladder's longest step. The hook's behaviour was correct throughout; the test's chosen
advance value was simply short of the real worst case.

## Fix

The test now advances fake time by 100 000 ms, comfortably past the 95 500 ms worst case,
with a comment explaining why that margin exists rather than using the budget value
itself.

## Regression guard

[`src/lib/serverStatus/useServerStatus.test.ts`](../../src/lib/serverStatus/useServerStatus.test.ts),
`gives up after the retry budget is exhausted`.

## Takeaway

When a test advances fake timers to the exact value of a constant the code under test also
uses, check whether the code can only _observe_ that threshold on its own schedule, which
is a slightly different, later moment - not the constant itself.
