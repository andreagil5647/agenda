import { useEffect, useId, useRef, useState, type JSX } from 'react';
import type { PlainMessageKey } from '../../lib/i18n/catalogues';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { useTheme } from '../../lib/themes/ThemeProvider';
import { nextTheme, THEMES, type ThemeId } from '../../lib/themes/themes';
import { Icon } from '../Icon';
import controls from '../controls.module.css';
import styles from './Dock.module.css';

const THEME_NAMES = {
  paper: 'theme.paper',
  midnight: 'theme.midnight',
} as const satisfies Record<ThemeId, PlainMessageKey>;

/**
 * A theme's drop of colour, painted in the colours of that theme whichever one
 * is on the page: the theme is named on the element, so the tokens it reads are
 * that theme's own.
 */
function Swatch({ theme }: { theme: ThemeId }): JSX.Element {
  return <span className={styles.swatch} data-theme={theme} aria-hidden="true" />;
}

/**
 * The theme controls of the dock. One button shows the theme in use and moves to
 * the next; beside it a second one opens the list of all of them, to choose one
 * directly. A change is also said out loud, in the language of the screen.
 */
export function ThemeSwitch(): JSX.Element {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [announcement, setAnnouncement] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const upcoming = nextTheme(theme);

  // An open list closes on Escape, giving focus back to the button that opened it, and when a
  // press or the keyboard goes anywhere outside the theme controls.
  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutside = (event: Event): void => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('focusin', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('focusin', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const choose = (next: ThemeId, origin: Element): void => {
    setTheme(next, origin);
    setAnnouncement(t('theme.changed', { theme: t(THEME_NAMES[next]) }));
  };

  return (
    <div
      ref={container}
      className={styles.themes}
      onBlur={(event) => {
        // Focus that went nowhere (off the end of the page) has no related element, and counts as leaving.
        const { relatedTarget } = event;
        if (!(relatedTarget instanceof Node) || !event.currentTarget.contains(relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={`${styles.option} ${styles.themeButton}`}
        aria-label={t('theme.switch', {
          current: t(THEME_NAMES[theme]),
          next: t(THEME_NAMES[upcoming]),
        })}
        onClick={(event) => {
          choose(upcoming, event.currentTarget);
        }}
      >
        <Swatch theme={theme} />
        <span className={styles.themeName}>{t(THEME_NAMES[theme])}</span>
      </button>
      <button
        ref={toggle}
        type="button"
        className={`${styles.option} ${styles.pickerToggle}`}
        aria-label={t('theme.choose')}
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <Icon name="chevron-up" />
      </button>
      {isOpen && (
        // Focusable, so that pressing the space between two choices is not mistaken for leaving.
        <div
          id={listId}
          className={styles.picker}
          role="group"
          aria-label={t('theme.group')}
          tabIndex={-1}
        >
          {THEMES.map(({ id }) => (
            <button
              key={id}
              type="button"
              className={`${styles.option} ${styles.pickerOption}`}
              aria-pressed={id === theme}
              onClick={(event) => {
                choose(id, event.currentTarget);
                setIsOpen(false);
                toggle.current?.focus();
              }}
            >
              <Swatch theme={id} />
              {t(THEME_NAMES[id])}
            </button>
          ))}
        </div>
      )}
      <p className={controls.visuallyHidden} role="status">
        {announcement}
      </p>
    </div>
  );
}
