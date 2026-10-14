import { readPreferences, writePreferences } from './devicePreferences';

const KEY = 'agenda.preferences';

afterEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('device preferences', () => {
  it('start empty on a device that has saved nothing', () => {
    expect(readPreferences()).toEqual({});
  });

  it('are read back as they were written', () => {
    writePreferences({ language: 'es' });

    expect(readPreferences()).toEqual({ language: 'es' });
  });

  it('keep what was saved before when one preference changes', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ language: 'es', future: true }));

    writePreferences({ language: 'en' });

    expect(readPreferences()).toEqual({ language: 'en' });
  });

  it('are read back with the language and the theme together', () => {
    writePreferences({ language: 'es' });
    writePreferences({ theme: 'midnight' });

    expect(readPreferences()).toEqual({ language: 'es', theme: 'midnight' });
  });

  it('keep a saved theme when only the language changes, and the other way round', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ language: 'es', theme: 'midnight' }));

    writePreferences({ language: 'en' });
    expect(readPreferences()).toEqual({ language: 'en', theme: 'midnight' });

    writePreferences({ theme: 'paper' });
    expect(readPreferences()).toEqual({ language: 'en', theme: 'paper' });
  });

  it('read the theme even when there is no language, and the language even when the theme is wrong', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ theme: 'midnight' }));
    expect(readPreferences()).toEqual({ theme: 'midnight' });

    window.localStorage.setItem(KEY, JSON.stringify({ language: 'es', theme: 'sepia' }));
    expect(readPreferences()).toEqual({ language: 'es' });
  });

  it.each([
    ['text that is not JSON', 'not json at all'],
    ['JSON that is not an object', '"es"'],
    ['a language the app does not have', JSON.stringify({ language: 'klingon' })],
    ['a language of the wrong type', JSON.stringify({ language: 7 })],
    ['a theme the app does not have', JSON.stringify({ theme: 'sepia' })],
    ['a theme of the wrong type', JSON.stringify({ theme: 7 })],
  ])('ignore %s instead of failing', (_name, stored) => {
    window.localStorage.setItem(KEY, stored);

    expect(readPreferences()).toEqual({});
  });

  it('can be read when the storage refuses to be read', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(readPreferences()).toEqual({});
  });

  it('do not fail when the storage refuses to be written', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(() => {
      writePreferences({ language: 'es' });
    }).not.toThrow();
  });
});
