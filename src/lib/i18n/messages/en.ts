import type { Catalogue } from '../translator';

/**
 * Every piece of text the app shows or announces, in English. This file is the
 * source: the other languages are checked against its keys and placeholders.
 * Text the user wrote (task titles, calendar names) never goes through here.
 */
export const en = {
  'brand.name': 'Agenda',
} as const satisfies Catalogue;
