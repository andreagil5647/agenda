import { useState, type JSX, type SyntheticEvent } from 'react';
import { readField } from '../../../lib/forms';
import type { PlainMessageKey } from '../../../lib/i18n/catalogues';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import controls from '../../../ui/controls.module.css';
import { Icon, type IconName } from '../../../ui/Icon';
import { Logo } from '../../../ui/Logo';
import { useAuth } from '../hooks/useAuth';
import { AuthPreview } from './AuthPreview';
import styles from './AuthScreen.module.css';

type AuthMode = 'login' | 'register';

const POINTS: readonly { icon: IconName; text: PlainMessageKey }[] = [
  { icon: 'clock', text: 'auth.points.drag' },
  { icon: 'sparkle', text: 'auth.points.keyboard' },
  { icon: 'check-circle', text: 'auth.points.safe' },
];

export function AuthScreen(): JSX.Element {
  const { logIn, register, startDemo, error, clearError } = useAuth();
  const { t } = useI18n();
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
          <span>{t('brand.name')}</span>
        </div>
        <h1>{t('auth.hero.title')}</h1>
        <p className={styles.lead}>{t('auth.hero.lead')}</p>
        <ul className={styles.points}>
          {POINTS.map(({ icon, text }) => (
            <li key={icon}>
              <span className={styles.pointIcon}>
                <Icon name={icon} />
              </span>
              {t(text)}
            </li>
          ))}
        </ul>
        <AuthPreview />
      </div>

      <div className={styles.card}>
        <section className={styles.demo} aria-labelledby="demo-title">
          <h2 id="demo-title">{t('auth.demo.title')}</h2>
          <p>{t('auth.demo.text')}</p>
          <button
            className={controls.primaryAction}
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void handleDemo();
            }}
          >
            {t('auth.demo.button')}
          </button>
        </section>

        <p className={styles.divider}>
          <span>{t(isRegistering ? 'auth.divider.register' : 'auth.divider.logIn')}</span>
        </p>

        <form
          aria-labelledby="auth-title"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <h2 id="auth-title" className={controls.visuallyHidden}>
            {t(isRegistering ? 'auth.register.heading' : 'auth.logIn')}
          </h2>
          {isRegistering && (
            <label>
              {t('auth.field.name')}
              <input name="displayName" autoComplete="name" minLength={1} maxLength={80} required />
            </label>
          )}
          <label>
            {t('auth.field.email')}
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            {t('auth.field.password')}
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
            {isSubmitting
              ? t('auth.submit.working')
              : t(isRegistering ? 'auth.register.submit' : 'auth.logIn')}
          </button>
        </form>

        <p className={styles.switch}>
          {t(isRegistering ? 'auth.switch.haveAccount' : 'auth.switch.newHere')}{' '}
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              switchMode(isRegistering ? 'login' : 'register');
            }}
          >
            {t(isRegistering ? 'auth.logIn' : 'auth.register.switch')}
          </button>
        </p>
      </div>
    </main>
  );
}
