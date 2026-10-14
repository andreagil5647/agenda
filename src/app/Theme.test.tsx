import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setDeviceColorScheme } from '../../test/helpers/colorScheme';
import { App } from './App';

const PREFERENCES_KEY = 'agenda.preferences';

function savedPreferences(): unknown {
  return JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) ?? '{}');
}

function pageTheme(): string | undefined {
  return document.documentElement.dataset.theme;
}

function browserBarColor(): string | null | undefined {
  return document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
}

beforeEach(() => {
  document.head.innerHTML = '<meta name="theme-color" content="#fbf5ea" />';
});

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.lang = '';
  document.head.innerHTML = '';
  jest.restoreAllMocks();
});

describe('the theme of the app', () => {
  it('starts as Paper on a device that has chosen nothing', async () => {
    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Theme: Paper. Switch to Midnight.' }),
    ).toBeInTheDocument();
    expect(pageTheme()).toBe('paper');
  });

  it('starts as Midnight on a device set to dark', async () => {
    setDeviceColorScheme('dark');
    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Theme: Midnight. Switch to Paper.' }),
    ).toBeInTheDocument();
    expect(pageTheme()).toBe('midnight');
    expect(browserBarColor()).toBe('#1b1620');
  });

  it('is the saved choice, not the device setting, when the two disagree', async () => {
    setDeviceColorScheme('dark');
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ theme: 'paper' }));
    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Theme: Paper. Switch to Midnight.' }),
    ).toBeInTheDocument();
    expect(pageTheme()).toBe('paper');
  });

  it('is changed from the corner of the sign-in screen, and says what it changed to', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));

    expect(pageTheme()).toBe('midnight');
    expect(browserBarColor()).toBe('#1b1620');
    expect(screen.getByRole('button', { name: 'Theme: Midnight. Switch to Paper.' })).toBeVisible();
    expect(screen.getByText('Theme changed to Midnight.')).toHaveAttribute('role', 'status');

    await user.click(screen.getByRole('button', { name: /^Theme: Midnight/ }));

    expect(pageTheme()).toBe('paper');
    expect(browserBarColor()).toBe('#fbf5ea');
    expect(screen.getByText('Theme changed to Paper.')).toBeInTheDocument();
  });

  it('is remembered on the next visit', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));
    expect(savedPreferences()).toEqual({ theme: 'midnight' });
    first.unmount();
    delete document.documentElement.dataset.theme;

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Theme: Midnight. Switch to Paper.' }),
    ).toBeInTheDocument();
    expect(pageTheme()).toBe('midnight');
  });

  it('is kept when the language changes, and the language is kept when the theme changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));

    await user.click(screen.getByRole('button', { name: 'Español' }));
    await screen.findByRole('button', { name: 'Tema: Medianoche. Cambiar a Papel.' });

    expect(pageTheme()).toBe('midnight');
    expect(savedPreferences()).toEqual({ language: 'es', theme: 'midnight' });

    await user.click(screen.getByRole('button', { name: /^Tema: Medianoche/ }));

    expect(savedPreferences()).toEqual({ language: 'es', theme: 'paper' });
  });

  it('is named and announced in the language of the screen', async () => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ language: 'es' }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      await screen.findByRole('button', { name: 'Tema: Papel. Cambiar a Medianoche.' }),
    );

    expect(screen.getByText('Tema cambiado a Medianoche.')).toHaveAttribute('role', 'status');
    expect(
      screen.getByRole('button', { name: 'Tema: Medianoche. Cambiar a Papel.' }),
    ).toHaveTextContent('Medianoche');
  });

  it('still changes when the choice cannot be saved on this device', async () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));

    expect(pageTheme()).toBe('midnight');
  });

  it('shows the theme in use as its visible name, and hides the colour drop from screen readers', async () => {
    render(<App />);
    const button = await screen.findByRole('button', { name: /^Theme: Paper/ });

    expect(button).toHaveTextContent('Paper');
    expect(button.querySelector('[data-theme="paper"]')).toHaveAttribute('aria-hidden', 'true');
  });
});
