import type { Translation } from '../translator';
import type { en } from './en';

/** The Spanish of every message in `en.ts`, written for Spain. A missing key does not compile. */
export const es: Translation<typeof en> = {
  'brand.name': 'Agenda',
};
