import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as Catalogues from '../../lib/i18n/catalogues';
import { loadCatalogue } from '../../lib/i18n/catalogues';
import { I18nProvider } from '../../lib/i18n/I18nProvider';
import { Dock } from './Dock';

// The real loader, except where a test makes it fail.
jest.mock('../../lib/i18n/catalogues', () => {
  const actual = jest.requireActual<typeof Catalogues>('../../lib/i18n/catalogues');
  return { ...actual, loadCatalogue: jest.fn(actual.loadCatalogue) };
});

afterEach(() => {
  window.localStorage.clear();
});

describe('Dock', () => {
  it('tells the reader when a language could not be loaded, and stays in the one in use', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Dock />
      </I18nProvider>,
    );
    jest.mocked(loadCatalogue).mockRejectedValueOnce(new Error('offline'));

    await user.click(await screen.findByRole('button', { name: 'Español' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load that language');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lets the reader try again, and clears the problem once it works', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Dock />
      </I18nProvider>,
    );
    jest.mocked(loadCatalogue).mockRejectedValueOnce(new Error('offline'));
    await user.click(await screen.findByRole('button', { name: 'Español' }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Español' }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('group', { name: 'Preferencias' })).toBeInTheDocument();
  });
});
