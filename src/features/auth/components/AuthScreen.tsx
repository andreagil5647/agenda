import { useState, type JSX, type SyntheticEvent } from 'react';
import { readField } from '../../../lib/forms';
import controls from '../../../ui/controls.module.css';
import { Icon, type IconName } from '../../../ui/Icon';
import { Logo } from '../../../ui/Logo';
import { useAuth } from '../hooks/useAuth';
import { AuthPreview } from './AuthPreview';
import styles from './AuthScreen.module.css';

type AuthMode = 'login' | 'register';

const POINTS: readonly { icon: IconName; text: string }[] = [
  { icon: 'clock', text: 'Drag a task onto the day to give it a time.' },
  { icon: 'sparkle', text: 'Everything you can drag, you can also do with the keyboard.' },
  {
    icon: 'check-circle',
    text: 'Changes show at once and are taken back if they cannot be saved.',
  },
];

export function AuthScreen(): JSX.Element {
  const { logIn, register, startDemo, error, clearError } = useAuth();
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
    const email = readField(form, 'email');
    const password = readField(form, 'password');
    const displayName = readField(form, 'displayName');

    setIsSubmitting(true);
    await (isRegistering ? register({ email, password, displayName }) : logIn({ email, password }));
    setIsSubmitting(false);
  };

  const handleDemo = async (): Promise<void> => {
    setIsSubmitting(true);
    await startDemo();
    setIsSubmitting(false);
  };

  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <div className={styles.brand}>
          <Logo size={48} />
          <span>Agenda</span>
        </div>
        <h1>Give every task a time.</h1>
        <p className={styles.lead}>
          Agenda puts your tasks and your events on one timeline, so the plan you make is a day you
          can actually keep.
        </p>
        <ul className={styles.points}>
          {POINTS.map(({ icon, text }) => (
            <li key={icon}>
              <span className={styles.pointIcon}>
                <Icon name={icon} />
              </span>
              {text}
            </li>
          ))}
        </ul>
        <AuthPreview />
      </div>

      <div className={styles.card}>
        <section className={styles.demo} aria-labelledby="demo-title">
          <h2 id="demo-title">Just looking around?</h2>
          <p>Open a ready-made day and try it. No sign-up, and nothing to set up.</p>
          <button
            className={controls.primaryAction}
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void handleDemo();
            }}
          >
            Try the demo
          </button>
        </section>

        <p className={styles.divider}>
          <span>or {isRegistering ? 'create an account' : 'log in'}</span>
        </p>

        <form
          aria-labelledby="auth-title"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <h2 id="auth-title" className={controls.visuallyHidden}>
            {isRegistering ? 'Create your account' : 'Log in'}
          </h2>
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
            <p className={controls.formError} role="alert">
              {error}
            </p>
          )}

          <button
            className={controls.secondaryAction}
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Working...' : isRegistering ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className={styles.switch}>
          {isRegistering ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              switchMode(isRegistering ? 'login' : 'register');
            }}
          >
            {isRegistering ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </div>
    </main>
  );
}
