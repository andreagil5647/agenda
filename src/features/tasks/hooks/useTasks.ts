import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CreateTaskRequest, PatchTaskRequest, Task } from '../../../lib/api/contract';
import { withChanges, withItem, withReplaced, withoutItem } from '../../../lib/query/listEdits';
import { useOptimisticListMutation } from '../../../lib/query/useOptimisticListMutation';
import { createTask, deleteTask, listTasks, updateTask } from '../api/tasksApi';

const tasksKey = ['tasks'] as const;

export function useTasks(): UseQueryResult<Task[]> {
  return useQuery({ queryKey: tasksKey, queryFn: listTasks });
}

/** A new task joins the list once the API has given it an id and a position. */
export function useCreateTask() {
  return useOptimisticListMutation<Task, CreateTaskRequest, Task>({
    queryKey: tasksKey,
    mutationFn: (input) => createTask(input),
    optimistic: (tasks) => tasks,
    confirmed: withItem,
  });
}

interface TaskUpdate {
  task: Task;
  changes: PatchTaskRequest;
}

/** Shows the change at once; the saved task then replaces it, carrying its new version. */
export function useUpdateTask() {
  return useOptimisticListMutation<Task, TaskUpdate, Task>({
    queryKey: tasksKey,
    mutationFn: ({ task, changes }, atSavedVersion) => updateTask(atSavedVersion(task), changes),
    optimistic: (tasks, { task, changes }) => withChanges(tasks, task.id, changes),
    confirmed: (tasks, saved, { task }) => withReplaced(tasks, task.id, saved),
  });
}

export function useDeleteTask() {
  return useOptimisticListMutation<Task, Task>({
    queryKey: tasksKey,
    mutationFn: (task, atSavedVersion) => deleteTask(atSavedVersion(task)),
    optimistic: (tasks, task) => withoutItem(tasks, task.id),
    confirmed: (tasks) => tasks,
  });
}
