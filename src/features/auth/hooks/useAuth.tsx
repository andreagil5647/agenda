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
import * as authApi from '../api/authApi';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  register: (input: Omit<RegisterRequest, 'timeZone'>) => Promise<void>;
  logIn: (input: LoginRequest) => Promise<void>;
  startDemo: () => Promise<void>;
  logOut: () => Promise<void>;
  /** The API stopped recognising the session while the app was in use. */
  expireSession: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ANONYMOUS: AuthState = { status: 'anonymous', user: null, error: null };

// On the sign-in form a 401 means the credentials, not an expired session.
const SIGN_IN_MESSAGES = { UNAUTHORIZED: 'That email and password do not match.' };
const SESSION_ENDED = 'Your session has ended. Log in again to continue.';

function signedIn(user: AuthUser): AuthState {
  return { status: 'authenticated', user, error: null };
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null, error: null });

  useEffect(() => {
    let isMounted = true;

    authApi
      .getSessionUser()
      .then((user) => {
        if (isMounted) setState(user ? signedIn(user) : ANONYMOUS);
      })
      .catch((error: unknown) => {
        if (isMounted) setState({ ...ANONYMOUS, error: describeError(error) });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /** Runs a sign-in request and moves to the planner, or shows why it failed. */
  const signInWith = useCallback(async (request: () => Promise<{ user: AuthUser }>) => {
    setState((current) => ({ ...current, error: null }));
    try {
      const { user } = await request();
      setState(signedIn(user));
    } catch (error) {
      setState({ ...ANONYMOUS, error: describeError(error, SIGN_IN_MESSAGES) });
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
    } catch (error) {
      setState((current) => ({ ...current, error: describeError(error) }));
    }
  }, []);

  const expireSession = useCallback(() => {
    setState({ ...ANONYMOUS, error: SESSION_ENDED });
  }, []);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, register, logIn, startDemo, logOut, expireSession, clearError }),
    [state, register, logIn, startDemo, logOut, expireSession, clearError],
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
