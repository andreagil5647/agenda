import { DEFAULT_LANGUAGE, type Language } from './languages';
import { en } from './messages/en';
import type { MessageArgs, Translate, Translation } from './translator';

/** The messages as English defines them: the source every other language is checked against. */
export type AppMessages = typeof en;

export type AppCatalogue = Translation<AppMessages>;

/** The `t` function of the app. */
export type AppTranslate = Translate<AppMessages>;

export type MessageKey = keyof AppMessages;

/**
 * The keys of messages that need no values. A table that maps something to a
 * message (a status, an error code) can only hold these, so `t(key)` is
 * always a complete call.
 */
export type PlainMessageKey = {
  [Key in MessageKey]: MessageArgs<AppMessages[Key]> extends [] ? Key : never;
}[MessageKey];

/** English is part of the main bundle, so the app can always start and fall back to it. */
export function bundledCatalogue(language: Language): AppCatalogue | undefined {
  return language === DEFAULT_LANGUAGE ? en : undefined;
}

/** Every other language is its own chunk, fetched the first time it is used. */
export async function loadCatalogue(language: Language): Promise<AppCatalogue> {
  switch (language) {
    case 'en':
      return en;
    case 'es':
      return (await import('./messages/es')).es;
  }
}
