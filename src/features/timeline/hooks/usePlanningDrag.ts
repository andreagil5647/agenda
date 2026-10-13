import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core';
import { useCallback, useRef, useState } from 'react';
import type { Task } from '../../../lib/api/contract';
import { spanAt, type TimeSpan } from '../dayLayout';
import { isDayGridTarget, isDraggedTask } from '../planningDrag';

/** A press only becomes a drag after this much movement, so clicks still click. */
const DRAG_START_DISTANCE_PX = 6;

interface PlanningDragOptions {
  onScheduleTask: (task: Task, span: TimeSpan) => void;
}

interface PlanningDrag {
  sensors: SensorDescriptor<SensorOptions>[];
  /** The task being dragged, for drawing what follows the pointer. */
  draggedTask: Task | null;
  /** Where the dragged item would land if released now, snapped to the grid. */
  landingSpan: TimeSpan | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragMove: (event: DragMoveEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  /**
   * Recomputes the landing span without a pointer move. The grid scrolls by
   * itself while something is held near its edge, which changes the time under
   * a pointer that has not moved.
   */
  onGridScroll: () => void;
}

/** The span a drag would produce over the grid right now, or null away from it. */
function landingSpanOf({ active, over }: DragMoveEvent | DragEndEvent): TimeSpan | null {
  const top = active.rect.current.translated?.top;
  const dragged: unknown = active.data.current;
  const target: unknown = over?.data.current;
  if (top === undefined || !isDraggedTask(dragged) || !isDayGridTarget(target)) {
    return null;
  }
  return spanAt(target.minutesAt(top), dragged.task.estimateMinutes);
}

function sameSpan(left: TimeSpan | null, right: TimeSpan | null): boolean {
  return left?.startMinutes === right?.startMinutes && left?.endMinutes === right?.endMinutes;
}

/**
 * Dragging onto the day grid: a task dropped on it becomes a block as long as
 * the task's estimate, starting where its top edge was released.
 */
export function usePlanningDrag({ onScheduleTask }: PlanningDragOptions): PlanningDrag {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_START_DISTANCE_PX } }),
  );
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [landingSpan, setLandingSpan] = useState<TimeSpan | null>(null);
  // The positions inside a drag event are live, so the last one can be read again later.
  const lastMove = useRef<DragMoveEvent | null>(null);

  const reset = useCallback(() => {
    lastMove.current = null;
    setDraggedTask(null);
    setLandingSpan(null);
  }, []);

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    const dragged: unknown = active.data.current;
    setDraggedTask(isDraggedTask(dragged) ? dragged.task : null);
  }, []);

  const showLanding = useCallback((event: DragMoveEvent) => {
    const next = landingSpanOf(event);
    // Pointer moves arrive far more often than the snapped span changes.
    setLandingSpan((current) => (sameSpan(current, next) ? current : next));
  }, []);

  const onDragMove = useCallback(
    (event: DragMoveEvent) => {
      lastMove.current = event;
      showLanding(event);
    },
    [showLanding],
  );

  const onGridScroll = useCallback(() => {
    if (lastMove.current) showLanding(lastMove.current);
  }, [showLanding]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const span = landingSpanOf(event);
      const dragged: unknown = event.active.data.current;
      if (span && isDraggedTask(dragged)) {
        onScheduleTask(dragged.task, span);
      }
      reset();
    },
    [onScheduleTask, reset],
  );

  return {
    sensors,
    draggedTask,
    landingSpan,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel: reset,
    onGridScroll,
  };
}
