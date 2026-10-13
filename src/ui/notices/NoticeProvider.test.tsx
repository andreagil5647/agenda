import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nProvider, useI18n } from '../../lib/i18n/I18nProvider';
import { NoticeProvider, useNotify } from './NoticeProvider';

function Harness(): JSX.Element {
  const notify = useNotify();
  const { setLanguage } = useI18n();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          notify((t) => t('error.NETWORK_ERROR'));
        }}
      >
        raise network
      </button>
      <button
        type="button"
        onClick={() => {
          notify((t) => t('error.generic'));
        }}
      >
        raise generic
      </button>
      <button
        type="button"
        onClick={() => {
          setLanguage('es');
        }}
      >
        use Spanish
      </button>
    </>
  );
}

function renderHarness(): ReturnType<typeof userEvent.setup> {
  render(
    <I18nProvider>
      <NoticeProvider>
        <Harness />
      </NoticeProvider>
    </I18nProvider>,
  );
  return userEvent.setup();
}

afterEach(() => {
  window.localStorage.clear();
});

describe('notices', () => {
  it('stay until they are dismissed', async () => {
    const user = renderHarness();

    await user.click(await screen.findByRole('button', { name: 'raise network' }));
    const notice = await screen.findByRole('alert');

    expect(notice).toHaveTextContent('Could not reach the server');

    await user.click(within(notice).getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('show a sentence once, however often it is raised, and dismiss it in one go', async () => {
    const user = renderHarness();
    const raise = await screen.findByRole('button', { name: 'raise network' });

    await user.click(raise);
    await user.click(raise);
    await user.click(raise);

    expect(screen.getAllByRole('alert')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('show different sentences side by side', async () => {
    const user = renderHarness();

    await user.click(await screen.findByRole('button', { name: 'raise network' }));
    await user.click(screen.getByRole('button', { name: 'raise generic' }));

    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('change language along with everything else while they are on screen', async () => {
    const user = renderHarness();
    await user.click(await screen.findByRole('button', { name: 'raise network' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'use Spanish' }));
    });

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent('No se pudo conectar con el servidor');
    expect(within(notice).getByRole('button', { name: 'Descartar' })).toBeInTheDocument();
  });
});
