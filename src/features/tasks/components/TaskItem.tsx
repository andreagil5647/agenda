import { useDraggable } from '@dnd-kit/core';
import type { JSX } from 'react';
import type { Task } from '../../../lib/api/contract';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import { formatDuration } from '../../../lib/time/formatTime';
import { Burst } from '../../../ui/Burst';
import controls from '../../../ui/controls.module.css';
import { Icon } from '../../../ui/Icon';
import { draggedTask } from '../../timeline/planningDrag';
import { useCelebration } from '../hooks/useCelebration';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  /** Whether there is a calendar to plan into; without one a task cannot be given time. */
  canPlan: boolean;
  /** Whether a block on the day in view is already set aside for this task. */
  isPlanned: boolean;
  /** Whether this is the last task left to do, so finishing it clears the list. */
  isLastOpen: boolean;
  onToggleDone: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** Gives the task a block on the day in view, at the next free time. */
  onPlan: (task: Task) => void;
}

/**
 * A task in the list. An open task can be given time in two ways: dragged by
 * its grip onto the timeline, or with the Plan button, which works from the
 * keyboard and places it at the next free time.
 */
export function TaskItem({
  task,
  canPlan,
  isPlanned,
  isLastOpen,
  onToggleDone,
  onDelete,
  onPlan,
}: TaskItemProps): JSX.Element {
  const { t, locale } = useI18n();
  const isOpen = task.status === 'todo';
  const { isCelebrating, size, start, stop } = useCelebration(isOpen);
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `task:${task.id}`,
    data: draggedTask(task),
    disabled: !isOpen || !canPlan,
  });

  return (
    <li className={styles.item} data-status={task.status} data-dragging={isDragging}>
      {/* A pointer-only shortcut, so it is hidden from assistive technology; Plan is the
          equivalent control. */}
      <span
        ref={setNodeRef}
        className={styles.grip}
        aria-hidden="true"
        title={isOpen ? t('tasks.item.drag') : undefined}
        {...listeners}
      >
        <Icon name="grip" />
      </span>
      <label className={styles.title}>
        <span className={styles.check}>
          <input
            type="checkbox"
            className={controls.checkboxAction}
            checked={!isOpen}
            onChange={() => {
              if (isOpen) {
                start(isLastOpen ? 'large' : 'small');
              }
              onToggleDone(task);
            }}
          />
          {isCelebrating && <Burst size={size} onEnd={stop} />}
        </span>
        <span className={styles.text}>{task.title}</span>
      </label>
      <small className={styles.meta}>
        <span className={styles.duration}>{formatDuration(task.estimateMinutes, locale)}</span>
        {isPlanned && <span className={styles.planned}>· {t('tasks.item.planned')}</span>}
      </small>
      {isOpen && canPlan && (
        <button
          type="button"
          className={styles.plan}
          aria-label={t('tasks.item.planLabel', { title: task.title })}
          onClick={() => {
            onPlan(task);
          }}
        >
          {t('tasks.item.plan')}
        </button>
      )}
      <button
        type="button"
        className={controls.iconAction}
        aria-label={t('tasks.item.deleteLabel', { title: task.title })}
        onClick={() => {
          onDelete(task);
        }}
      >
        <Icon name="close" />
      </button>
    </li>
  );
}
