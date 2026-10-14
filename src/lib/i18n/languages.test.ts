import { detectLanguage, intlLocale, isLanguage, LANGUAGES, LANGUAGE_NAMES } from './languages';

describe('isLanguage', () => {
  it('accepts the languages the app has, and nothing else', () => {
    expect(LANGUAGES.every(isLanguage)).toBe(true);
    for (const other of ['fr', 'EN', 'en-GB', '', 7, null, undefined, {}]) {
      expect(isLanguage(other)).toBe(false);
    }
  });
});

describe('detectLanguage', () => {
  it('prefers a saved choice over everything else', () => {
    expect(detectLanguage('es', ['en-US'])).toBe('es');
    expect(detectLanguage('en', ['es-ES'])).toBe('en');
  });

  it('follows the first supported language the browser lists', () => {
    expect(detectLanguage(undefined, ['es-MX', 'en-US'])).toBe('es');
    expect(detectLanguage(undefined, ['fr-FR', 'es-ES', 'en'])).toBe('es');
  });

  it('matches on the language, whatever the region or the case', () => {
    expect(detectLanguage(undefined, ['ES'])).toBe('es');
    expect(detectLanguage(undefined, ['en-GB'])).toBe('en');
  });

  it('falls back to English when nothing the browser lists is supported', () => {
    expect(detectLanguage(undefined, ['fr-FR', 'de'])).toBe('en');
    expect(detectLanguage(undefined, [])).toBe('en');
  });
});

describe('intlLocale', () => {
  it("keeps the region of the browser's own tag for the same language", () => {
    expect(intlLocale('en', ['es-ES', 'en-GB'])).toBe('en-GB');
    expect(intlLocale('es', ['es-MX'])).toBe('es-MX');
  });

  it('uses the plain language when the browser does not list it', () => {
    expect(intlLocale('es', ['en-US'])).toBe('es');
  });
});

describe('LANGUAGE_NAMES', () => {
  it('names every language, in that language', () => {
    expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual([...LANGUAGES].sort());
    expect(LANGUAGE_NAMES.es).toBe('Español');
  });
});
