import { LANGUAGES } from '../languages';
import type { Catalogue, MessageValue } from '../translator';
import { en } from './en';
import { es } from './es';

/**
 * Text that is the same in both languages on purpose: a name, a version label, and templates
 * made only of placeholders. Anything else left identical to English is a missed translation.
 */
const SAME_IN_BOTH_LANGUAGES = new Set(['brand.name', 'shell.version', 'app.status.elapsed']);

const translations: Readonly<Record<(typeof LANGUAGES)[number], Catalogue>> = { en, es };

function texts(value: MessageValue): string[] {
  return typeof value === 'string' ? [value] : [value.one, value.other];
}

function placeholders(value: MessageValue): string[] {
  const names = texts(value).flatMap((text) =>
    [...text.matchAll(/\{(\w+)\}/g)].flatMap((match) => (match[1] ? [match[1]] : [])),
  );
  return [...new Set(names)].sort();
}

describe.each(LANGUAGES.filter((language) => language !== 'en'))('the %s messages', (language) => {
  const translation = translations[language];

  it('have the same keys as English', () => {
    expect(Object.keys(translation).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(Object.entries(en))('%s keeps the placeholders of the English message', (key, source) => {
    const translated = translation[key];

    expect(translated).toBeDefined();
    expect(typeof translated).toBe(typeof source);
    expect(placeholders(translated ?? '')).toEqual(placeholders(source));
  });

  it.each(Object.entries(en))('%s is translated, not left in English', (key, source) => {
    if (SAME_IN_BOTH_LANGUAGES.has(key)) return;

    expect(translation[key]).not.toEqual(source);
  });

  it('has no message that is empty', () => {
    for (const value of Object.values(translation)) {
      for (const text of texts(value)) {
        expect(text.trim()).not.toBe('');
      }
    }
  });
});
