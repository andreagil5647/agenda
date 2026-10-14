import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '../../../lib/api/contract';
import { describeError } from '../../../lib/api/errorMessages';
import type { AppTranslate } from '../../../lib/i18n/catalogues';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import * as authApi from '../api/authApi';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

/**
 * What went wrong, kept as what happened and not as text: the sentence is
 * written when it is shown, so it follows the language if that changes while
 * the message is on screen.
 */
type AuthFailure =
  | { kind: 'general'; cause: unknown }
  // On the sign-in form a 401 means the credentials, not an expired session.
  | { kind: 'signIn'; cause: unknown }
  | { kind: 'sessionEnded' };

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  failure: AuthFailure | null;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** The failure as a sentence in the current language, or null. */
  error: string | null;
  register: (input: Omit<RegisterRequest, 'timeZone'>) => Promise<void>;
  logIn: (input: LoginRequest) => Promise<void>;
  startDemo: () => Promise<void>;
  logOut: () => Promise<void>;
  /** The API stopped recognising the session while the app was in use. */
  expireSession: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ANONYMOUS: AuthState = { status: 'anonymous', user: null, failure: null };

function signedIn(user: AuthUser): AuthState {
  return { status: 'authenticated', user, failure: null };
}

function describeFailure(failure: AuthFailure, t: AppTranslate): string {
  switch (failure.kind) {
    case 'sessionEnded':
      return t('error.UNAUTHORIZED');
    case 'signIn':
      return describeError(failure.cause, t, { UNAUTHORIZED: 'auth.invalidCredentials' });
    case 'general':
      return describeError(failure.cause, t);
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useI18n();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null, failure: null });

  useEffect(() => {
    let isMounted = true;

    authApi
      .getSessionUser()
      .then((user) => {
        if (isMounted) setState(user ? signedIn(user) : ANONYMOUS);
      })
      .catch((cause: unknown) => {
        if (isMounted) setState({ ...ANONYMOUS, failure: { kind: 'general', cause } });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /** Runs a sign-in request and moves to the planner, or shows why it failed. */
  const signInWith = useCallback(async (request: () => Promise<{ user: AuthUser }>) => {
    setState((current) => ({ ...current, failure: null }));
    try {
      const { user } = await request();
      setState(signedIn(user));
    } catch (cause) {
      setState({ ...ANONYMOUS, failure: { kind: 'signIn', cause } });
    }
  }, []);

  const register = useCallback<AuthContextValue['register']>(
    (input) => signInWith(() => authApi.register(input)),
    [signInWith],
  );

  const logIn = useCallback<AuthContextValue['logIn']>(
    (input) => signInWith(() => authApi.logIn(input)),
    [signInWith],
  );

  const startDemo = useCallback(() => signInWith(authApi.startDemo), [signInWith]);

  const logOut = useCallback(async () => {
    try {
      await authApi.logOut();
      setState(ANONYMOUS);
    } catch (cause) {
      setState((current) => ({ ...current, failure: { kind: 'general', cause } }));
    }
  }, []);

  const expireSession = useCallback(() => {
    setState({ ...ANONYMOUS, failure: { kind: 'sessionEnded' } });
  }, []);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, failure: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      error: state.failure ? describeFailure(state.failure, t) : null,
      register,
      logIn,
      startDemo,
      logOut,
      expireSession,
      clearError,
    }),
    [state, t, register, logIn, startDemo, logOut, expireSession, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
