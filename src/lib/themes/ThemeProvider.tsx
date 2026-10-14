import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { readPreferences, writePreferences } from '../preferences/devicePreferences';
import { applyTheme, deviceIsSetToDark } from './applyTheme';
import { detectTheme, type ThemeId } from './themes';

interface ThemeValue {
  theme: ThemeId;
  /** Changes the theme at once and remembers the choice on this device. */
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

/**
 * Holds the theme of the page. The script in index.html has normally put it on
 * the page already; this makes the app agree with it, and does the work if the
 * script did not run. The theme goes on the page before it is painted.
 */
export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setThemeState] = useState(() =>
    detectTheme(readPreferences().theme, deviceIsSetToDark()),
  );

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeId): void => {
    writePreferences({ theme: next });
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
