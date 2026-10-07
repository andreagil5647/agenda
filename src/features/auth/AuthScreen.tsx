import { useState, type JSX, type SyntheticEvent } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';

type AuthMode = 'login' | 'register';

export function AuthScreen(): JSX.Element {
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === 'register';

  const switchMode = (nextMode: AuthMode): void => {
    setMode(nextMode);
    clearError();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = readFormString(form, 'email');
    const password = readFormString(form, 'password');
    const displayName = readFormString(form, 'displayName');

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register({ email, password, displayName });
      } else {
        await login({ email, password });
      }
    } catch {
      // The provider stores the user-facing error.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-layout" aria-labelledby="auth-title">
      <div className="auth-copy">
        <p className="eyebrow">Agenda</p>
        <h1 id="auth-title">Plan work on one honest timeline.</h1>
        <p>
          Tasks and events share the day, so the plan you make is the plan your calendar can
          actually hold.
        </p>
      </div>

      <div className="auth-panel">
        <div className="segmented" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            aria-selected={mode === 'login'}
            role="tab"
            onClick={() => {
              switchMode('login');
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={isRegistering ? 'active' : ''}
            aria-selected={isRegistering}
            role="tab"
            onClick={() => {
              switchMode('register');
            }}
          >
            Create account
          </button>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          {isRegistering && (
            <label>
              Name
              <input name="displayName" autoComplete="name" minLength={1} maxLength={80} required />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={8}
              maxLength={128}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Working...' : isRegistering ? 'Create account' : 'Log in'}
          </button>
        </form>
      </div>
    </section>
  );
}

function readFormString(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
