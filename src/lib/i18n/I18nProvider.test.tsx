import { act, render, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import type * as Catalogues from './catalogues';
import { loadCatalogue } from './catalogues';
import { I18nProvider, useI18n } from './I18nProvider';
import type { Language } from './languages';

// The real loader, except where a test makes it fail.
jest.mock('./catalogues', () => {
  const actual = jest.requireActual<typeof Catalogues>('./catalogues');
  return { ...actual, loadCatalogue: jest.fn(actual.loadCatalogue) };
});

function Probe(): JSX.Element {
  const { t, language, locale, setLanguage, languageLoadFailed } = useI18n();

  return (
    <>
      <p>name: {t('brand.name')}</p>
      <p>language: {language}</p>
      <p>locale: {locale}</p>
      <p>failed: {String(languageLoadFailed)}</p>
      <button
        type="button"
        onClick={() => {
          setLanguage('es');
        }}
      >
        switch to Spanish
      </button>
    </>
  );
}

function browserLanguages(languages: readonly string[]): void {
  jest.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages);
}

async function startOn(languages: readonly string[], saved?: Language): Promise<void> {
  browserLanguages(languages);
  if (saved) {
    window.localStorage.setItem('agenda.preferences', JSON.stringify({ language: saved }));
  }
  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
  await screen.findByText(/^language:/);
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = '';
  jest.restoreAllMocks();
});

describe('I18nProvider', () => {
  it('starts in the language of the browser, and says so on the page', async () => {
    await startOn(['es-MX', 'en-US']);

    expect(screen.getByText('language: es')).toBeInTheDocument();
    expect(screen.getByText('locale: es-MX')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
  });

  it('starts in English when the browser asks for a language the app does not have', async () => {
    await startOn(['fr-FR']);

    expect(screen.getByText('language: en')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('starts in the saved language rather than the one the browser prefers', async () => {
    await startOn(['en-GB'], 'es');

    expect(screen.getByText('language: es')).toBeInTheDocument();
  });

  it('keeps the regional variant of the browser for dates and numbers', async () => {
    await startOn(['en-GB']);

    expect(screen.getByText('locale: en-GB')).toBeInTheDocument();
  });

  it('switches language when asked, remembers the choice, and updates the page', async () => {
    await startOn(['en-US']);

    act(() => {
      screen.getByRole('button', { name: 'switch to Spanish' }).click();
    });

    expect(await screen.findByText('language: es')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
    expect(JSON.parse(window.localStorage.getItem('agenda.preferences') ?? '{}')).toEqual({
      language: 'es',
    });
  });

  it('stays as it was, and says so, when the new language cannot be loaded', async () => {
    await startOn(['en-US']);
    // The next download of the Spanish messages fails, as a dropped connection would.
    jest.mocked(loadCatalogue).mockRejectedValueOnce(new Error('chunk failed'));

    act(() => {
      screen.getByRole('button', { name: 'switch to Spanish' }).click();
    });

    await waitFor(() => {
      expect(screen.getByText('failed: true')).toBeInTheDocument();
    });
    expect(screen.getByText('language: en')).toBeInTheDocument();
  });
});
