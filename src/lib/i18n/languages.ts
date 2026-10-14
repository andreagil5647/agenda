/** The languages the interface is available in. */
export const LANGUAGES = ['en', 'es'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Each language is named in itself, never translated: someone who cannot read
 * the current language has to be able to find their own.
 */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
  en: 'English',
  es: 'Español',
};

function primarySubtag(tag: string): string {
  return (tag.split('-')[0] ?? '').toLowerCase();
}

/**
 * The language to start in: a saved choice, otherwise the first language in
 * the browser's own list that the app supports, otherwise English.
 */
export function detectLanguage(
  saved: Language | undefined,
  browserLanguages: readonly string[],
): Language {
  if (saved) {
    return saved;
  }

  for (const tag of browserLanguages) {
    const match = LANGUAGES.find((language) => language === primarySubtag(tag));
    if (match) {
      return match;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * The tag to give to `Intl` for dates and numbers. A reader whose browser says
 * `en-GB` and who uses the app in English gets British dates; one who chose a
 * language their browser does not list gets the language's own default.
 */
export function intlLocale(language: Language, browserLanguages: readonly string[]): string {
  return browserLanguages.find((tag) => primarySubtag(tag) === language) ?? language;
}
