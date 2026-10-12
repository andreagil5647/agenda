import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { useCallback, useState, type JSX } from 'react';
import { CalendarPanel } from '../features/calendars/components/CalendarPanel';
import { useCalendars } from '../features/calendars/hooks/useCalendars';
import { TaskPanel } from '../features/tasks/components/TaskPanel';
import { useTasks } from '../features/tasks/hooks/useTasks';
import { BlockEditor } from '../features/timeline/components/BlockEditor';
import { DayHeader } from '../features/timeline/components/DayHeader';
import { DragPreview } from '../features/timeline/components/DragPreview';
import {
  DayView,
  NEW_BLOCK_MINUTES,
  START_OF_WORKDAY_MINUTES,
} from '../features/timeline/components/DayView';
import { firstFreeStart, spanAt, type TimeSpan } from '../features/timeline/dayLayout';
import { useCreateBlock } from '../features/timeline/hooks/useCreateBlock';
import { useDayPlan } from '../features/timeline/hooks/useDayPlan';
import { useDeleteEvent, useUpdateEvent } from '../features/timeline/hooks/useEvents';
import { useNow } from '../features/timeline/hooks/useNow';
import { usePlanningDrag } from '../features/timeline/hooks/usePlanningDrag';
import { useSelectedDay } from '../features/timeline/hooks/useSelectedDay';
import type { AuthUser, PlannerEvent, Task } from '../lib/api/contract';
import { formatTimeRange } from '../lib/time/formatTime';
import { instantAt, minutesOfDay } from '../lib/time/zonedTime';
import controls from '../ui/controls.module.css';
import styles from './PlannerPage.module.css';

const NEW_BLOCK_TITLE = 'New block';

interface PlannerPageProps {
  /** Days are laid out in this account's time zone and written in its locale. */
  settings: AuthUser['settings'];
}

/** The day planner: one day's timeline next to the tasks and calendars that feed it. */
export function PlannerPage({ settings }: PlannerPageProps): JSX.Element {
  const { timeZone, hourCycle, locale } = settings;
  const selected = useSelectedDay(timeZone);
  const now = useNow();
  const nowMinutes = selected.isToday ? minutesOfDay(now, timeZone) : null;

  const plan = useDayPlan(selected.day, timeZone);
  const calendars = useCalendars().data ?? [];
  const tasks = useTasks().data ?? [];
  const createBlock = useCreateBlock({ day: selected.day, timeZone, calendar: calendars[0] });
  const { mutate: updateEvent } = useUpdateEvent();
  const { mutate: deleteEvent } = useDeleteEvent();

  // Selection is kept by id: the event itself is replaced each time it is saved.
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = plan.eventsQuery.data?.find((event) => event.id === selectedEventId);
  // Read out by screen readers when planning changes something away from the focus.
  const [announcement, setAnnouncement] = useState('');

  /** The next time of day at which `durationMinutes` fit without overlapping a block. */
  const nextFreeSpan = (durationMinutes: number): TimeSpan => {
    const from = nowMinutes ?? START_OF_WORKDAY_MINUTES;
    return spanAt(firstFreeStart(plan.blocks, durationMinutes, from) ?? from, durationMinutes);
  };

  const createUntitledBlock = (span: TimeSpan): void => {
    // The new block is selected once saved, so its title can be typed straight away.
    createBlock({
      title: NEW_BLOCK_TITLE,
      span,
      onSaved: (event) => {
        setSelectedEventId(event.id);
      },
    });
  };

  const scheduleTask = useCallback(
    (task: Task, span: TimeSpan): void => {
      createBlock({ title: task.title, span, taskId: task.id });
      const times = formatTimeRange(span.startMinutes, span.endMinutes, hourCycle);
      setAnnouncement(`Planned ${task.title} for ${times}.`);
    },
    [createBlock, hourCycle],
  );

  /** Gives a block new times on the day in view, and says so for those who cannot see it move. */
  const reschedule = useCallback(
    (event: PlannerEvent, span: TimeSpan, verb: string): void => {
      updateEvent({
        event,
        changes: {
          startUtc: instantAt(selected.day, span.startMinutes, timeZone).toISOString(),
          endUtc: instantAt(selected.day, span.endMinutes, timeZone).toISOString(),
        },
      });
      const times = formatTimeRange(span.startMinutes, span.endMinutes, hourCycle);
      setAnnouncement(`${verb} ${event.title}: ${times}.`);
    },
    [updateEvent, selected.day, timeZone, hourCycle],
  );
  const moveBlock = useCallback(
    (event: PlannerEvent, span: TimeSpan): void => {
      reschedule(event, span, 'Moved');
    },
    [reschedule],
  );
  const resizeBlock = (event: PlannerEvent, span: TimeSpan): void => {
    reschedule(event, span, 'Resized');
  };
  const deleteBlock = (event: PlannerEvent): void => {
    deleteEvent(event);
    setAnnouncement(`Deleted ${event.title}.`);
  };

  const drag = usePlanningDrag({ onScheduleTask: scheduleTask, onMoveBlock: moveBlock });
  const plannedTaskIds = new Set(plan.blocks.map((block) => block.event.taskId));

  return (
    <DndContext
      sensors={drag.sensors}
      collisionDetection={pointerWithin}
      onDragStart={drag.onDragStart}
      onDragMove={drag.onDragMove}
      onDragEnd={drag.onDragEnd}
      onDragCancel={drag.onDragCancel}
    >
      <DayHeader
        day={selected.day}
        isToday={selected.isToday}
        locale={locale}
        onShowDay={selected.showDay}
        onShowToday={selected.showToday}
        onShowPrevious={selected.showPrevious}
        onShowNext={selected.showNext}
      />
      <div className={styles.layout}>
        <DayView
          day={selected.day}
          hourCycle={hourCycle}
          eventsQuery={plan.eventsQuery}
          blocks={plan.blocks}
          allDayEvents={plan.allDayEvents}
          calendars={calendars}
          nowMinutes={nowMinutes}
          landingSpan={drag.landingSpan}
          onGridScroll={drag.onGridScroll}
          selectedEventId={selectedEventId}
          onSelectEvent={(event) => {
            setSelectedEventId(event.id);
          }}
          onMoveBlock={moveBlock}
          onResizeBlock={resizeBlock}
          onDeleteBlock={deleteBlock}
          onCreateBlock={createUntitledBlock}
          onAddBlock={() => {
            createUntitledBlock(nextFreeSpan(NEW_BLOCK_MINUTES));
          }}
        />
        <div className={styles.side}>
          {selectedEvent && (
            <BlockEditor
              event={selectedEvent}
              calendars={calendars}
              linkedTask={tasks.find((task) => task.id === selectedEvent.taskId)}
              timeZone={timeZone}
              onClose={() => {
                setSelectedEventId(null);
              }}
            />
          )}
          <TaskPanel
            day={selected.day}
            canPlan={calendars.length > 0}
            plannedTaskIds={plannedTaskIds}
            onPlanTask={(task) => {
              scheduleTask(task, nextFreeSpan(task.estimateMinutes));
            }}
          />
          <CalendarPanel />
        </div>
      </div>

      <p className={controls.visuallyHidden} role="status">
        {announcement}
      </p>
      <DragOverlay dropAnimation={null}>
        {drag.dragged && <DragPreview item={drag.dragged} />}
      </DragOverlay>
    </DndContext>
  );
}
