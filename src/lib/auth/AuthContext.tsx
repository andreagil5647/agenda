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
import { apiClient, ApiError } from '../api/apiClient';
import type { AuthenticatedSession, LoginRequest, RegisterRequest } from '../api/types';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  session: AuthenticatedSession | null;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  register: (input: RegisterRequest) => Promise<void>;
  login: (input: LoginRequest) => Promise<void>;
  startDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Could not reach the server. Try again in a moment.';
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
    error: null,
  });

  const refreshSession = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const session = await apiClient.getSession();
      setState({
        status: session.user ? 'authenticated' : 'anonymous',
        session: session.user ? session : null,
        error: null,
      });
    } catch (error) {
      setState({ status: 'anonymous', session: null, error: friendlyError(error) });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void apiClient
      .getSession()
      .then((session) => {
        if (!isMounted) return;
        setState({
          status: session.user ? 'authenticated' : 'anonymous',
          session: session.user ? session : null,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setState({ status: 'anonymous', session: null, error: friendlyError(error) });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const register = useCallback(async (input: RegisterRequest) => {
    setState((current) => ({ ...current, error: null }));
    try {
      const session = await apiClient.register(input);
      setState({ status: 'authenticated', session, error: null });
    } catch (error) {
      setState({ status: 'anonymous', session: null, error: friendlyError(error) });
      throw error;
    }
  }, []);

  const login = useCallback(async (input: LoginRequest) => {
    setState((current) => ({ ...current, error: null }));
    try {
      const session = await apiClient.login(input);
      setState({ status: 'authenticated', session, error: null });
    } catch (error) {
      setState({ status: 'anonymous', session: null, error: friendlyError(error) });
      throw error;
    }
  }, []);

  const startDemo = useCallback(async () => {
    setState((current) => ({ ...current, error: null }));
    try {
      const session = await apiClient.demo();
      setState({ status: 'authenticated', session, error: null });
    } catch (error) {
      setState({ status: 'anonymous', session: null, error: friendlyError(error) });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const csrfToken = state.session?.csrfToken;
    setState((current) => ({ ...current, error: null }));

    try {
      if (csrfToken) {
        await apiClient.logout(csrfToken);
      }
      setState({ status: 'anonymous', session: null, error: null });
    } catch (error) {
      setState((current) => ({ ...current, error: friendlyError(error) }));
      throw error;
    }
  }, [state.session?.csrfToken]);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, register, login, startDemo, logout, refreshSession, clearError }),
    [clearError, login, logout, refreshSession, register, startDemo, state],
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
