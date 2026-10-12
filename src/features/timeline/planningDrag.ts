/**
 * What travels with a drag and what a drop lands on. dnd-kit carries these as
 * untyped data, so each has a guard that the drop handler checks before use.
 */
import type { Task } from '../../lib/api/contract';

export const DAY_GRID_DROP_ID = 'day-grid';

/** A task picked up from the task list, to be given a time on the grid. */
export interface DraggedTask {
  kind: 'task';
  task: Task;
}

/** The day grid as a drop target: it knows which time of day a screen position is. */
export interface DayGridTarget {
  minutesAt: (clientY: number) => number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function draggedTask(task: Task): DraggedTask {
  return { kind: 'task', task };
}

export function isDraggedTask(data: unknown): data is DraggedTask {
  return isRecord(data) && data.kind === 'task' && isRecord(data.task);
}

export function isDayGridTarget(data: unknown): data is DayGridTarget {
  return isRecord(data) && typeof data.minutesAt === 'function';
}
