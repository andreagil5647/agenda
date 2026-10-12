import { api, unwrap, unwrapEmpty } from '../../../lib/api/client';
import type {
  AuthenticatedSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '../../../lib/api/contract';

/** The zone a new account starts in, so its first day view matches the visitor's clock. */
function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// The endpoint answers with a session, or with a body whose user is null. The
// second shape does not survive type generation, so the two are told apart at
// runtime.
function isAuthenticated(session: object): session is AuthenticatedSession {
  return 'user' in session && session.user !== null;
}

/** The signed-in user, or null for a visitor without a session. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await unwrap(api.GET('/api/v1/auth/session'));
  return isAuthenticated(session) ? session.user : null;
}

export function register(input: Omit<RegisterRequest, 'timeZone'>): Promise<AuthenticatedSession> {
  return unwrap(
    api.POST('/api/v1/auth/register', { body: { ...input, timeZone: browserTimeZone() } }),
  );
}

export function logIn(input: LoginRequest): Promise<AuthenticatedSession> {
  return unwrap(api.POST('/api/v1/auth/login', { body: input }));
}

export function startDemo(): Promise<AuthenticatedSession> {
  return unwrap(api.POST('/api/v1/auth/demo', { body: { timeZone: browserTimeZone() } }));
}

export function logOut(): Promise<void> {
  return unwrapEmpty(api.POST('/api/v1/auth/logout'));
}
