/**
 * jsdom has no `matchMedia`, which is how a page asks about the device: whether it is set to
 * dark, whether its owner asked for less motion. This gives it one that answers for the
 * settings below and for nothing else. Every test starts from the defaults.
 */
interface DeviceSettings {
  colorScheme: 'light' | 'dark';
  reducedMotion: boolean;
}

const DEFAULTS: DeviceSettings = { colorScheme: 'light', reducedMotion: false };

let device = DEFAULTS;

function answers(query: string): boolean {
  switch (query) {
    case '(prefers-color-scheme: dark)':
      return device.colorScheme === 'dark';
    case '(prefers-reduced-motion: reduce)':
      return device.reducedMotion;
    default:
      return false;
  }
}

function install(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): Partial<MediaQueryList> => ({ media: query, matches: answers(query) }),
  });
}

export function setDevice(changes: Partial<DeviceSettings>): void {
  device = { ...device, ...changes };
  install();
}

export function resetDevice(): void {
  device = DEFAULTS;
  install();
}
