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
import type { PlannerEvent, Task } from '../../../lib/api/contract';
import { spanAt, type TimeSpan } from '../dayLayout';
import { draggedMinutes, isDayGridTarget, isDraggedItem, type DraggedItem } from '../planningDrag';

/** A press only becomes a drag after this much movement, so clicks still click. */
const DRAG_START_DISTANCE_PX = 6;

interface PlanningDragOptions {
  onScheduleTask: (task: Task, span: TimeSpan) => void;
  onMoveBlock: (event: PlannerEvent, span: TimeSpan) => void;
}

interface PlanningDrag {
  sensors: SensorDescriptor<SensorOptions>[];
  /** What is being dragged, for drawing what follows the pointer. */
  dragged: DraggedItem | null;
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

function draggedItemOf({ active }: DragStartEvent | DragMoveEvent): DraggedItem | null {
  const data: unknown = active.data.current;
  return isDraggedItem(data) ? data : null;
}

/** The span a drag would produce over the grid right now, or null away from it. */
function landingSpanOf(event: DragMoveEvent | DragEndEvent): TimeSpan | null {
  const top = event.active.rect.current.translated?.top;
  const item = draggedItemOf(event);
  const target: unknown = event.over?.data.current;
  if (top === undefined || !item || !isDayGridTarget(target)) {
    return null;
  }
  return spanAt(target.minutesAt(top), draggedMinutes(item));
}

function sameSpan(left: TimeSpan | null, right: TimeSpan | null): boolean {
  return left?.startMinutes === right?.startMinutes && left?.endMinutes === right?.endMinutes;
}

/**
 * Dragging onto the day grid. A task dropped on it becomes a block as long as
 * the task's estimate; a block dropped on it moves there. Either way the top
 * edge of what is dragged decides the start time.
 */
export function usePlanningDrag({
  onScheduleTask,
  onMoveBlock,
}: PlanningDragOptions): PlanningDrag {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_START_DISTANCE_PX } }),
  );
  const [dragged, setDragged] = useState<DraggedItem | null>(null);
  const [landingSpan, setLandingSpan] = useState<TimeSpan | null>(null);
  // The positions inside a drag event are live, so the last one can be read again later.
  const lastMove = useRef<DragMoveEvent | null>(null);

  const reset = useCallback(() => {
    lastMove.current = null;
    setDragged(null);
    setLandingSpan(null);
  }, []);

  const onDragStart = useCallback((event: DragStartEvent) => {
    setDragged(draggedItemOf(event));
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
      const item = draggedItemOf(event);
      reset();
      // Released away from the grid: nothing is planned and nothing moves.
      if (!span || !item) return;

      if (item.kind === 'task') {
        onScheduleTask(item.task, span);
      } else if (!sameSpan(span, item.span)) {
        onMoveBlock(item.event, span);
      }
    },
    [onScheduleTask, onMoveBlock, reset],
  );

  return {
    sensors,
    dragged,
    landingSpan,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel: reset,
    onGridScroll,
  };
}
