import type { JSX, SyntheticEvent } from 'react';
import type { Task } from '../../../lib/api/contract';
import { readField } from '../../../lib/forms';
import { formatDuration } from '../../../lib/time/formatTime';
import controls from '../../../ui/controls.module.css';
import { Panel } from '../../../ui/Panel';
import { QueryBoundary } from '../../../ui/QueryBoundary';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks';
import styles from './TaskPanel.module.css';

const DEFAULT_ESTIMATE_MINUTES = 30;

interface TaskPanelProps {
  /** The day on screen; a new task is due on it unless another date is chosen. */
  day: string;
}

export function TaskPanel({ day }: TaskPanelProps): JSX.Element {
  const tasksQuery = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const openCount = tasksQuery.data?.filter((task) => task.status === 'todo').length;

  const submitTask = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
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
    updateTask.mutate({ task, changes: { status: task.status === 'done' ? 'todo' : 'done' } });
  };

  return (
    <Panel
      eyebrow="Inbox"
      title="Tasks"
      aside={openCount === undefined ? null : <span>{openCount} open</span>}
    >
      <form className={styles.form} autoComplete="off" onSubmit={submitTask}>
        <input name="title" aria-label="New task" placeholder="New task" maxLength={160} required />
        <input key={day} name="dueDate" type="date" aria-label="Due date" defaultValue={day} />
        <input
          name="estimateMinutes"
          type="number"
          min={5}
          max={1440}
          step={5}
          aria-label="Estimate in minutes"
          defaultValue={DEFAULT_ESTIMATE_MINUTES}
        />
        <button type="submit" className={controls.primaryAction} disabled={createTask.isPending}>
          Add task
        </button>
      </form>

      <QueryBoundary query={tasksQuery} loadingLabel="Loading tasks...">
        {(tasks) =>
          tasks.length === 0 ? (
            <p className={styles.empty}>No tasks yet. Add the first one above.</p>
          ) : (
            <ul className={styles.list}>
              {tasks.map((task) => (
                <li key={task.id} className={styles.item} data-status={task.status}>
                  <label className={styles.title}>
                    <input
                      type="checkbox"
                      className={controls.checkboxAction}
                      checked={task.status === 'done'}
                      onChange={() => {
                        toggleDone(task);
                      }}
                    />
                    <span>{task.title}</span>
                  </label>
                  <small>{formatDuration(task.estimateMinutes)}</small>
                  <button
                    type="button"
                    className={controls.iconAction}
                    aria-label={`Delete ${task.title}`}
                    onClick={() => {
                      deleteTask.mutate(task);
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </Panel>
  );
}
