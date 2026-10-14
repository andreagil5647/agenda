/**
 * jsdom has no `matchMedia`, which is how a page asks whether the device is set to dark.
 * This gives it one that answers for the given scheme, and for nothing else.
 */
export function setDeviceColorScheme(scheme: 'light' | 'dark'): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): Partial<MediaQueryList> => ({
      media: query,
      matches: query === '(prefers-color-scheme: dark)' && scheme === 'dark',
    }),
  });
}
