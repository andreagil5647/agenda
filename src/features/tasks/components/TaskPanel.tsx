import { useState, type JSX, type SyntheticEvent } from 'react';
import type { Task } from '../../../lib/api/contract';
import { readField } from '../../../lib/forms';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import controls from '../../../ui/controls.module.css';
import { EmptyState } from '../../../ui/EmptyState';
import { Panel } from '../../../ui/Panel';
import { QueryBoundary } from '../../../ui/QueryBoundary';
import { useCelebration } from '../hooks/useCelebration';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks';
import { OpenCount } from './OpenCount';
import { TaskItem } from './TaskItem';
import styles from './TaskPanel.module.css';

const DEFAULT_ESTIMATE_MINUTES = 30;

interface TaskPanelProps {
  /** The day on screen; a new task is due on it unless another date is chosen. */
  day: string;
  /** Whether a block can be created at all, which needs a calendar to put it in. */
  canPlan: boolean;
  /** The tasks that already have a block on the day on screen. */
  plannedTaskIds: ReadonlySet<string | null>;
  /** Gives a task a block on the day on screen, at the next free time. */
  onPlanTask: (task: Task) => void;
}

export function TaskPanel({
  day,
  canPlan,
  plannedTaskIds,
  onPlanTask,
}: TaskPanelProps): JSX.Element {
  const { t } = useI18n();
  const tasksQuery = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  // Counted so that the number of open tasks can tell the reader's own changes from others.
  const [readerActions, setReaderActions] = useState(0);
  const noteReaderAction = (): void => {
    setReaderActions((actions) => actions + 1);
  };

  const openCount = tasksQuery.data?.filter((task) => task.status === 'todo').length;
  // Every task done, and there is at least one: a clear day. A list still loading is not clear.
  const isClear = openCount === 0 && (tasksQuery.data?.length ?? 0) > 0;
  const clearDay = useCelebration(!isClear);

  const submitTask = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    noteReaderAction();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    createTask.mutate(
      {
        title: readField(form, 'title'),
        dueDate: readField(form, 'dueDate') || null,
        estimateMinutes: Number(readField(form, 'estimateMinutes')) || DEFAULT_ESTIMATE_MINUTES,
      },
      {
        onSuccess: () => {
          formElement.reset();
        },
      },
    );
  };

  const toggleDone = (task: Task): void => {
    noteReaderAction();
    if (task.status === 'todo' && openCount === 1) clearDay.start();
    updateTask.mutate({ task, changes: { status: task.status === 'done' ? 'todo' : 'done' } });
  };

  return (
    <Panel
      title={t('tasks.title')}
      icon="check-circle"
      aside={<OpenCount count={openCount} readerActions={readerActions} />}
    >
      <form className={styles.form} autoComplete="off" onSubmit={submitTask}>
        <input
          name="title"
          aria-label={t('tasks.new')}
          placeholder={t('tasks.new')}
          maxLength={160}
          required
        />
        <input
          key={day}
          name="dueDate"
          type="date"
          aria-label={t('tasks.dueDate')}
          defaultValue={day}
        />
        <input
          name="estimateMinutes"
          type="number"
          min={5}
          max={1440}
          step={5}
          aria-label={t('tasks.estimate')}
          defaultValue={DEFAULT_ESTIMATE_MINUTES}
        />
        <button type="submit" className={controls.primaryAction} disabled={createTask.isPending}>
          {t('tasks.add')}
        </button>
      </form>

      {/* Always on the page, so that what appears in it is read out when the last task is done. */}
      <p
        className={styles.praise}
        role="status"
        data-moment={clearDay.isCelebrating ? '' : undefined}
        onAnimationEnd={clearDay.stop}
      >
        {isClear ? t('tasks.allDone') : ''}
      </p>

      <QueryBoundary query={tasksQuery} loadingLabel={t('tasks.loading')}>
        {(tasks) =>
          tasks.length === 0 ? (
            <EmptyState icon="leaf" title={t('tasks.empty.title')}>
              {t('tasks.empty.hint')}
            </EmptyState>
          ) : (
            <ul className={styles.list}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  canPlan={canPlan}
                  isPlanned={plannedTaskIds.has(task.id)}
                  isLastOpen={task.status === 'todo' && openCount === 1}
                  onToggleDone={toggleDone}
                  onDelete={(task) => {
                    noteReaderAction();
                    deleteTask.mutate(task);
                  }}
                  onPlan={onPlanTask}
                />
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </Panel>
  );
}
