import { useState, type JSX } from 'react';
import type { PlainMessageKey } from '../../lib/i18n/catalogues';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { LANGUAGE_NAMES, LANGUAGES } from '../../lib/i18n/languages';
import { useTheme } from '../../lib/themes/ThemeProvider';
import { nextTheme, type ThemeId } from '../../lib/themes/themes';
import controls from '../controls.module.css';
import styles from './Dock.module.css';

const THEME_NAMES = {
  paper: 'theme.paper',
  midnight: 'theme.midnight',
} as const satisfies Record<ThemeId, PlainMessageKey>;

/**
 * The corner of the screen where preferences are changed, on every screen,
 * the sign-in one included: the language, and the theme. The controls for
 * sound belong here too.
 */
export function Dock(): JSX.Element {
  const { t, language, setLanguage, languageLoadFailed } = useI18n();
  const { theme, setTheme } = useTheme();
  const [announcement, setAnnouncement] = useState('');
  const upcoming = nextTheme(theme);

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
        <button
          type="button"
          className={`${styles.option} ${styles.themeButton}`}
          aria-label={t('theme.switch', {
            current: t(THEME_NAMES[theme]),
            next: t(THEME_NAMES[upcoming]),
          })}
          onClick={() => {
            setTheme(upcoming);
            setAnnouncement(t('theme.changed', { theme: t(THEME_NAMES[upcoming]) }));
          }}
        >
          {/* Painted in the colours of its own theme, whichever one is on the page. */}
          <span className={styles.swatch} data-theme={theme} aria-hidden="true" />
          <span className={styles.themeName}>{t(THEME_NAMES[theme])}</span>
        </button>
      </div>
      {languageLoadFailed && (
        <p className={styles.problem} role="alert">
          {t('language.loadFailed')}
        </p>
      )}
      <p className={controls.visuallyHidden} role="status">
        {announcement}
      </p>
    </div>
  );
}
