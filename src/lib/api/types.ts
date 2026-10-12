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
