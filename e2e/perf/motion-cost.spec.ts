import { expect, test, type Page } from '@playwright/test';
import { z } from 'zod';
import { pointAtTime } from '../support/grid';
import { openPlanner } from '../support/planner';

/** How much slower than this machine the CPU is made to run, as a modest phone might be. */
const CPU_SLOWDOWN = 6;
const ROUNDS_PER_MODE = 3;
const PAUSE_MS = 450;

const watched = z.object({
  seen: z.array(z.object({ name: z.string(), duration: z.number(), inputDelay: z.number() })),
  longTasks: z.number(),
});

interface Summary {
  interactions: number;
  slowOnes: number;
  worstMs: number;
  worstInputDelayMs: number;
  longTasks: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/**
 * Starts recording, in the page, every interaction that took 16 ms or more to show its result and
 * every long task. What is recorded is kept in an attribute of the page, so that it can be read
 * back as text and checked.
 */
async function startWatching(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen: { name: string; duration: number; inputDelay: number }[] = [];
    let longTasks = 0;
    const save = (): void => {
      document.documentElement.dataset.watched = JSON.stringify({ seen, longTasks });
    };
    const eventOptions: PerformanceObserverInit & { durationThreshold: number } = {
      type: 'event',
      durationThreshold: 16,
    };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry instanceof PerformanceEventTiming) {
          seen.push({
            name: entry.name,
            duration: entry.duration,
            inputDelay: entry.processingStart - entry.startTime,
          });
        }
      }
      save();
    }).observe(eventOptions);
    new PerformanceObserver((list) => {
      longTasks += list.getEntries().length;
      save();
    }).observe({ type: 'longtask' });
    save();
  });
}

async function readWatched(page: Page): Promise<z.infer<typeof watched>> {
  const text = await page.locator('html').getAttribute('data-watched');
  return watched.parse(JSON.parse(text ?? '{}'));
}

/** The same things a person does in a minute of planning, done again and again. */
async function planForAMinute(page: Page): Promise<void> {
  const task = page
    .getByRole('region', { name: 'Tasks' })
    .getByRole('listitem')
    .filter({ hasText: 'Write release notes' })
    .getByRole('checkbox');
  const next = page.getByRole('button', { name: 'Next day' });
  const previous = page.getByRole('button', { name: 'Previous day' });
  const standUp = page.getByRole('button', { name: /^Stand-up/ });
  const lunch = page.getByRole('button', { name: /^Lunch with Marta/ });
  const pause = (): Promise<void> => page.waitForTimeout(PAUSE_MS);

  for (let round = 0; round < 3; round += 1) {
    await task.click(); // finish it: the burst
    await pause();
    await task.click(); // and open it again
    await pause();
    await next.click(); // the day slides
    await pause();
    await previous.click();
    await pause();
    await standUp.click(); // the details come in
    await pause();
    await lunch.click();
    await pause();
    const point = await pointAtTime(page, '05:00');
    await page.mouse.click(point.x, point.y); // a block grows
    await pause();
    await page.getByRole('button', { name: 'Delete block' }).click(); // and shrinks away
    await pause();
  }
}

async function measureOnce(page: Page, reducedMotion: boolean): Promise<Summary> {
  await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  await openPlanner(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  await startWatching(page);

  await planForAMinute(page);

  const { seen, longTasks } = await readWatched(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return {
    interactions: seen.length,
    slowOnes: seen.filter((entry) => entry.duration >= 200).length,
    worstMs: Math.max(0, ...seen.map((entry) => entry.duration)),
    worstInputDelayMs: Math.max(0, ...seen.map((entry) => entry.inputDelay)),
    longTasks,
  };
}

test(`what motion costs, at ${String(CPU_SLOWDOWN)}x slower than this machine`, async ({
  page,
}) => {
  const results: Record<'with motion' | 'reduced motion', Summary[]> = {
    'with motion': [],
    'reduced motion': [],
  };

  // Alternated, so that neither always has the cache or the machine's mood to itself.
  for (let round = 0; round < ROUNDS_PER_MODE; round += 1) {
    results['reduced motion'].push(await measureOnce(page, true));
    results['with motion'].push(await measureOnce(page, false));
  }

  const rows = Object.entries(results).map(([mode, runs]) => ({
    mode,
    'interactions of 16 ms or more': median(runs.map((run) => run.interactions)),
    'of 200 ms or more': median(runs.map((run) => run.slowOnes)),
    'worst interaction (ms)': Math.round(median(runs.map((run) => run.worstMs))),
    'worst input delay (ms)': Math.round(median(runs.map((run) => run.worstInputDelayMs))),
    'long tasks': median(runs.map((run) => run.longTasks)),
  }));
  const header = Object.keys(rows[0] ?? {});
  const lines = [header.join(' | '), ...rows.map((row) => Object.values(row).join(' | '))];
  process.stdout.write(['', ...lines, JSON.stringify(results), ''].join('\n'));
  expect(rows).toHaveLength(2);
});
