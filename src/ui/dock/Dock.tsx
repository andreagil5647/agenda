import type { JSX } from 'react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { LANGUAGE_NAMES, LANGUAGES } from '../../lib/i18n/languages';
import styles from './Dock.module.css';
import { ThemeSwitch } from './ThemeSwitch';

/**
 * The corner of the screen where preferences are changed, on every screen,
 * the sign-in one included: the language, and the theme. The controls for
 * sound belong here too.
 */
export function Dock(): JSX.Element {
  const { t, language, setLanguage, languageLoadFailed } = useI18n();

  return (
    <div className={styles.dock} role="group" aria-label={t('dock.label')}>
      <div className={styles.pill}>
        <div className={styles.group} role="group" aria-label={t('language.label')}>
          {LANGUAGES.map((option) => (
            <button
              key={option}
              type="button"
              // Each language is written, and so read aloud, in itself.
              lang={option}
              className={styles.option}
              aria-pressed={option === language}
              onClick={() => {
                setLanguage(option);
              }}
            >
              {LANGUAGE_NAMES[option]}
            </button>
          ))}
        </div>
        <ThemeSwitch />
      </div>
      {languageLoadFailed && (
        <p className={styles.problem} role="alert">
          {t('language.loadFailed')}
        </p>
      )}
    </div>
  );
}
