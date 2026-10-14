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
import { readPreferences, writePreferences } from '../preferences/devicePreferences';
import {
  bundledCatalogue,
  loadCatalogue,
  type AppCatalogue,
  type AppMessages,
  type AppTranslate,
} from './catalogues';
import { DEFAULT_LANGUAGE, detectLanguage, intlLocale, type Language } from './languages';
import { createTranslator } from './translator';

interface ActiveLanguage {
  language: Language;
  catalogue: AppCatalogue;
}

interface I18nValue {
  language: Language;
  /** The tag to give `Intl`, such as `en-GB`, for dates and numbers. */
  locale: string;
  t: AppTranslate;
  /** Asks for another language. The screen changes once its messages have arrived. */
  setLanguage: (language: Language) => void;
  /** The last switch could not load its messages, so the language did not change. */
  languageLoadFailed: boolean;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

function browserLanguages(): readonly string[] {
  return navigator.languages;
}

/**
 * Holds the language of the interface. What the reader asked for and what is on
 * screen are kept apart: a language other than English is a separate download,
 * and until it has arrived the screen stays as it is, so it never shows a mixture.
 */
export function I18nProvider({ children }: { children: ReactNode }): JSX.Element | null {
  const [requested, setRequested] = useState(() =>
    detectLanguage(readPreferences().language, browserLanguages()),
  );
  const [active, setActive] = useState<ActiveLanguage | null>(() => {
    const catalogue = bundledCatalogue(requested);
    return catalogue ? { language: requested, catalogue } : null;
  });
  const [languageLoadFailed, setLanguageLoadFailed] = useState(false);

  useEffect(() => {
    if (active?.language === requested) {
      return;
    }

    // A newer request makes this one obsolete: whatever it loads is dropped.
    let isCurrent = true;
    loadCatalogue(requested)
      .then((catalogue) => {
        if (isCurrent) setActive({ language: requested, catalogue });
      })
      .catch(() => {
        if (!isCurrent) return;
        setLanguageLoadFailed(true);
        // Go back to what is on screen, or start in English if nothing is yet.
        const english = bundledCatalogue(DEFAULT_LANGUAGE);
        if (active) {
          setRequested(active.language);
        } else if (english) {
          setRequested(DEFAULT_LANGUAGE);
          setActive({ language: DEFAULT_LANGUAGE, catalogue: english });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [active, requested]);

  const language = active?.language;
  useEffect(() => {
    if (language) document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language): void => {
    // What the reader chose is kept even if loading it fails this time, so the next visit tries again.
    writePreferences({ language: next });
    setLanguageLoadFailed(false);
    setRequested(next);
  }, []);

  const value = useMemo<I18nValue | null>(() => {
    if (!active) {
      return null;
    }
    const locale = intlLocale(active.language, browserLanguages());
    return {
      language: active.language,
      locale,
      t: createTranslator<AppMessages>(active.catalogue, locale),
      setLanguage,
      languageLoadFailed,
    };
  }, [active, setLanguage, languageLoadFailed]);

  if (!value) {
    return null;
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return value;
}
