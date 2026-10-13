/**
 * The arithmetic of the day grid: where a block sits, how blocks that overlap
 * share the width, and what a move, a resize or a drop does to a block's
 * times. Pure functions over minutes from midnight; nothing here knows about
 * pixels, the DOM or the current time.
 */
import type { PlannerEvent } from '../../lib/api/contract';
import { addDays, instantAt, minutesOfDay, MINUTES_PER_DAY } from '../../lib/time/zonedTime';

/** Times on the grid are rounded to this, and it is the shortest block allowed. */
export const GRID_STEP_MINUTES = 15;

/** The part of a day a block covers, from `startMinutes` up to `endMinutes`. */
export interface TimeSpan {
  startMinutes: number;
  endMinutes: number;
}

export interface DayBlock extends TimeSpan {
  event: PlannerEvent;
  /** The event runs past this day, so the block shows only the part that falls on it. */
  isClipped: boolean;
}

/** A block with its place among the blocks it overlaps: column `column` of `columns`. */
export interface PlacedBlock extends DayBlock {
  column: number;
  columns: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function snapToGrid(minutes: number): number {
  return Math.round(minutes / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
}

/** The start of the grid step that a time of day falls in. */
export function slotStart(minutes: number): number {
  return Math.floor(minutes / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
}

/**
 * The timed events that fall on `day`, as blocks. An event that starts the
 * day before or ends the day after is cut at midnight, so it shows the part
 * that belongs to this day.
 */
export function toDayBlocks(events: PlannerEvent[], day: string, timeZone: string): DayBlock[] {
  const dayStart = instantAt(day, 0, timeZone).getTime();
  const dayEnd = instantAt(addDays(day, 1), 0, timeZone).getTime();
  const blocks: DayBlock[] = [];

  for (const event of events) {
    if (event.kind !== 'timed' || !event.startUtc || !event.endUtc) continue;

    const start = new Date(event.startUtc);
    const end = new Date(event.endUtc);
    if (end.getTime() <= dayStart || start.getTime() >= dayEnd) continue;

    const startsEarlier = start.getTime() < dayStart;
    const endsLater = end.getTime() > dayEnd;
    blocks.push({
      event,
      startMinutes: startsEarlier ? 0 : minutesOfDay(start, timeZone),
      endMinutes: end.getTime() >= dayEnd ? MINUTES_PER_DAY : minutesOfDay(end, timeZone),
      isClipped: startsEarlier || endsLater,
    });
  }

  return blocks;
}

function byStartThenLongest(left: DayBlock, right: DayBlock): number {
  return (
    left.startMinutes - right.startMinutes ||
    right.endMinutes - left.endMinutes ||
    left.event.id.localeCompare(right.event.id)
  );
}

/**
 * Gives every block a column so that blocks which overlap in time sit side by
 * side instead of on top of each other.
 *
 * Blocks are taken in start order and grouped into clusters: runs of blocks
 * connected by overlaps. Inside a cluster each block goes in the first column
 * that is free at its start time, and every block of the cluster is as wide
 * as one column of it. A block that overlaps nothing keeps the full width.
 */
export function layoutDayBlocks(blocks: DayBlock[]): PlacedBlock[] {
  const placed: PlacedBlock[] = [];
  let cluster: PlacedBlock[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = 0;

  const closeCluster = (): void => {
    for (const block of cluster) {
      block.columns = columnEnds.length;
    }
    placed.push(...cluster);
    cluster = [];
    columnEnds = [];
  };

  for (const block of blocks.toSorted(byStartThenLongest)) {
    if (cluster.length > 0 && block.startMinutes >= clusterEnd) {
      closeCluster();
    }

    const freeColumn = columnEnds.findIndex((end) => end <= block.startMinutes);
    const column = freeColumn === -1 ? columnEnds.length : freeColumn;
    columnEnds[column] = block.endMinutes;
    clusterEnd = Math.max(clusterEnd, block.endMinutes);
    cluster.push({ ...block, column, columns: 1 });
  }
  closeCluster();

  return placed;
}

/** A span of `durationMinutes` starting at `startMinutes`, snapped and kept inside the day. */
export function spanAt(startMinutes: number, durationMinutes: number): TimeSpan {
  const duration = clamp(durationMinutes, GRID_STEP_MINUTES, MINUTES_PER_DAY);
  const start = clamp(snapToGrid(startMinutes), 0, MINUTES_PER_DAY - duration);
  return { startMinutes: start, endMinutes: start + duration };
}

/** The span moved by `deltaMinutes`, keeping its length and staying inside the day. */
export function movedBy(span: TimeSpan, deltaMinutes: number): TimeSpan {
  return spanAt(span.startMinutes + deltaMinutes, span.endMinutes - span.startMinutes);
}

/** The span with its end moved by `deltaMinutes`, never shorter than one grid step. */
export function resizedBy(span: TimeSpan, deltaMinutes: number): TimeSpan {
  const end = clamp(
    snapToGrid(span.endMinutes + deltaMinutes),
    span.startMinutes + GRID_STEP_MINUTES,
    MINUTES_PER_DAY,
  );
  return { startMinutes: span.startMinutes, endMinutes: end };
}

/**
 * The earliest start at or after `fromMinutes` where `durationMinutes` fit
 * without touching any of `taken`, or null if the rest of the day is full.
 */
export function firstFreeStart(
  taken: TimeSpan[],
  durationMinutes: number,
  fromMinutes: number,
): number | null {
  let start = Math.ceil(fromMinutes / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;

  for (const span of taken.toSorted((left, right) => left.startMinutes - right.startMinutes)) {
    if (span.endMinutes <= start) continue;
    if (span.startMinutes >= start + durationMinutes) break;
    start = Math.ceil(span.endMinutes / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  }

  return start + durationMinutes <= MINUTES_PER_DAY ? start : null;
}

/** The time of day at a vertical offset into a column that is `columnHeight` tall. */
export function minutesAtOffset(offset: number, columnHeight: number): number {
  return columnHeight > 0 ? (offset / columnHeight) * MINUTES_PER_DAY : 0;
}
