/**
 * What travels with a drag and what a drop lands on. dnd-kit carries these as
 * untyped data, so each has a guard that the drop handler checks before use.
 */
import type { PlannerEvent, Task } from '../../lib/api/contract';
import type { DayBlock, TimeSpan } from './dayLayout';

export const DAY_GRID_DROP_ID = 'day-grid';

/** A task picked up from the task list, to be given a time on the grid. */
export interface DraggedTask {
  kind: 'task';
  task: Task;
}

/** A block picked up from the grid, to be moved to another time of the same day. */
export interface DraggedBlock {
  kind: 'block';
  event: PlannerEvent;
  span: TimeSpan;
}

export type DraggedItem = DraggedTask | DraggedBlock;

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

export function draggedBlock({ event, startMinutes, endMinutes }: DayBlock): DraggedBlock {
  return { kind: 'block', event, span: { startMinutes, endMinutes } };
}

export function isDraggedItem(data: unknown): data is DraggedItem {
  if (!isRecord(data)) return false;
  return data.kind === 'task'
    ? isRecord(data.task)
    : data.kind === 'block' && isRecord(data.event) && isRecord(data.span);
}

export function isDayGridTarget(data: unknown): data is DayGridTarget {
  return isRecord(data) && typeof data.minutesAt === 'function';
}

/** What the dragged item is called, for the preview that follows the pointer. */
export function draggedTitle(item: DraggedItem): string {
  return item.kind === 'task' ? item.task.title : item.event.title;
}

/** How long the block is, or will be: a task becomes a block as long as its estimate. */
export function draggedMinutes(item: DraggedItem): number {
  return item.kind === 'task'
    ? item.task.estimateMinutes
    : item.span.endMinutes - item.span.startMinutes;
}
