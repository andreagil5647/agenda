export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId: string;
}

export interface UserSettings {
  timeZone: string;
  weekStartsOn: 0 | 1 | 6;
  hourCycle: 'h12' | 'h23';
  locale: string;
  theme: 'system' | 'light' | 'dark';
  accentColor: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  settings: UserSettings;
  isDemo: boolean;
}

export interface AuthenticatedSession {
  user: AuthUser;
  expiresAt: string;
  csrfToken: string;
}

export interface AnonymousSession {
  user: null;
}

export type SessionResponse = AuthenticatedSession | AnonymousSession;

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Calendar {
  id: string;
  name: string;
  colorKey: string;
  visible: boolean;
  defaultReminderMinutes: number[];
  order: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  priority: 'none' | 'low' | 'medium' | 'high';
  status: 'todo' | 'done';
  estimateMinutes: number;
  order: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventBlock {
  id: string;
  calendarId: string;
  title: string;
  notes: string | null;
  taskId: string | null;
  kind: 'timed' | 'allDay';
  startUtc: string | null;
  endUtc: string | null;
  timeZone: string | null;
  startDate: string | null;
  endDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarRequest {
  name: string;
  colorKey: string;
  visible?: boolean;
  defaultReminderMinutes?: number[];
}

export interface CreateTaskRequest {
  title: string;
  dueDate?: string | null;
  priority?: Task['priority'];
  status?: Task['status'];
  estimateMinutes?: number;
}

export interface CreateTimedEventRequest {
  kind: 'timed';
  calendarId: string;
  title: string;
  notes?: string | null;
  taskId?: string | null;
  startUtc: string;
  endUtc: string;
  timeZone: string;
}
