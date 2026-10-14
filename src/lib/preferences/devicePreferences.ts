import { isLanguage, type Language } from '../i18n/languages';
import { isThemeId, type ThemeId } from '../themes/themes';

const STORAGE_KEY = 'agenda.preferences';

/**
 * What this device remembers between visits. Each field is checked on its own
 * and left out if it is not valid, so a value written by an older version of
 * the app, or edited by hand, can never stop the app from starting. It is
 * checked by hand: a schema library would add tens of kilobytes to every
 * visitor's first load to validate one field.
 */
export interface DevicePreferences {
  language?: Language;
  theme?: ThemeId;
}

/** Storage can be missing or refuse access (private windows, blocked site data). */
function deviceStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parse(raw: string | null): DevicePreferences {
  if (raw === null) {
    return {};
  }

  try {
    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== 'object' || stored === null) {
      return {};
    }

    const preferences: DevicePreferences = {};
    if ('language' in stored && isLanguage(stored.language)) {
      preferences.language = stored.language;
    }
    if ('theme' in stored && isThemeId(stored.theme)) {
      preferences.theme = stored.theme;
    }
    return preferences;
  } catch {
    return {};
  }
}

export function readPreferences(): DevicePreferences {
  try {
    return parse(deviceStorage()?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return {};
  }
}

/** Changes the given preferences and keeps the others. Failing to save is not an error. */
export function writePreferences(changes: DevicePreferences): void {
  try {
    deviceStorage()?.setItem(STORAGE_KEY, JSON.stringify({ ...readPreferences(), ...changes }));
  } catch {
    // The preference only lasts until the page closes, which is acceptable.
  }
}
