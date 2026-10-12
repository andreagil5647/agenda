import { api, ifMatch, unwrap, unwrapEmpty } from '../../../lib/api/client';
import type { CreateTaskRequest, PatchTaskRequest, Task } from '../../../lib/api/contract';

export function listTasks(): Promise<Task[]> {
  return unwrap(api.GET('/api/v1/tasks'));
}

export function createTask(input: CreateTaskRequest): Promise<Task> {
  return unwrap(api.POST('/api/v1/tasks', { body: input }));
}

export function updateTask(task: Task, changes: PatchTaskRequest): Promise<Task> {
  return unwrap(
    api.PATCH('/api/v1/tasks/{id}', {
      params: { path: { id: task.id }, header: ifMatch(task) },
      body: changes,
    }),
  );
}

export function deleteTask(task: Task): Promise<void> {
  return unwrapEmpty(
    api.DELETE('/api/v1/tasks/{id}', {
      params: { path: { id: task.id }, header: ifMatch(task) },
    }),
  );
}
