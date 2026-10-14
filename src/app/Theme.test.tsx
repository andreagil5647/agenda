import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setDevice } from '../../test/helpers/device';
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

function namesOf(list: HTMLElement): (string | null)[] {
  return within(list)
    .getAllByRole('button')
    .map((button) => button.textContent);
}

beforeEach(() => {
  document.head.innerHTML = '<meta name="theme-color" content="#fbf5ea" />';
});

afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition');
  Reflect.deleteProperty(document.documentElement, 'animate');
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
      await screen.findByRole('button', { name: 'Theme: Paper. Switch to Arcade.' }),
    ).toBeInTheDocument();
    expect(pageTheme()).toBe('paper');
  });

  it('starts as Midnight on a device set to dark', async () => {
    setDevice({ colorScheme: 'dark' });
    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Theme: Midnight. Switch to Paper.' }),
    ).toBeInTheDocument();
    expect(pageTheme()).toBe('midnight');
    expect(browserBarColor()).toBe('#1b1620');
  });

  it('is the saved choice, not the device setting, when the two disagree', async () => {
    setDevice({ colorScheme: 'dark' });
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ theme: 'seaside' }));
    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Theme: Seaside. Switch to Midnight.' }),
    ).toBeInTheDocument();
    expect(pageTheme()).toBe('seaside');
  });

  it('is changed from the corner of the sign-in screen, and says what it changed to', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));

    expect(pageTheme()).toBe('arcade');
    expect(browserBarColor()).toBe('#0c0f24');
    expect(screen.getByRole('button', { name: 'Theme: Arcade. Switch to Seaside.' })).toBeVisible();
    expect(screen.getByText('Theme changed to Arcade.')).toHaveAttribute('role', 'status');
  });

  it('goes through every theme in order and starts again after the last', async () => {
    const user = userEvent.setup();
    render(<App />);
    const visited = [pageTheme()];

    for (const name of [/^Theme: Paper/, /^Theme: Arcade/, /^Theme: Seaside/, /^Theme: Midnight/]) {
      await user.click(await screen.findByRole('button', { name }));
      visited.push(pageTheme());
    }

    expect(visited).toEqual(['paper', 'arcade', 'seaside', 'midnight', 'paper']);
    expect(browserBarColor()).toBe('#fbf5ea');
  });

  it('is remembered on the next visit', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));
    expect(savedPreferences()).toEqual({ theme: 'arcade' });
    first.unmount();
    delete document.documentElement.dataset.theme;

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Theme: Arcade. Switch to Seaside.' }),
    ).toBeInTheDocument();
    expect(pageTheme()).toBe('arcade');
  });

  it('is kept when the language changes, and the language is kept when the theme changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));

    await user.click(screen.getByRole('button', { name: 'Español' }));
    await screen.findByRole('button', { name: 'Tema: Recreativa. Cambiar a Costa.' });

    expect(pageTheme()).toBe('arcade');
    expect(savedPreferences()).toEqual({ language: 'es', theme: 'arcade' });

    await user.click(screen.getByRole('button', { name: /^Tema: Recreativa/ }));

    expect(savedPreferences()).toEqual({ language: 'es', theme: 'seaside' });
  });

  it('is named and announced in the language of the screen', async () => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ language: 'es' }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      await screen.findByRole('button', { name: 'Tema: Papel. Cambiar a Recreativa.' }),
    );

    expect(screen.getByText('Tema cambiado a Recreativa.')).toHaveAttribute('role', 'status');
    expect(
      screen.getByRole('button', { name: 'Tema: Recreativa. Cambiar a Costa.' }),
    ).toHaveTextContent('Recreativa');
  });

  it('still changes when the choice cannot be saved on this device', async () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));

    expect(pageTheme()).toBe('arcade');
  });

  it('is revealed from the button, inside a view transition, when the browser has them', async () => {
    const start = jest.fn((update: () => void) => {
      update();
      return { ready: Promise.resolve() };
    });
    const animate = jest.fn();
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
    Object.defineProperty(document.documentElement, 'animate', {
      configurable: true,
      value: animate,
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));

    expect(start).toHaveBeenCalledTimes(1);
    expect(pageTheme()).toBe('arcade');
    await waitFor(() => {
      expect(animate).toHaveBeenCalledTimes(1);
    });
  });

  it('is not revealed with a circle when the reader asked for less motion', async () => {
    const start = jest.fn();
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
    setDevice({ reducedMotion: true });
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /^Theme: Paper/ }));

    expect(pageTheme()).toBe('arcade');
    expect(start).not.toHaveBeenCalled();
  });

  it('shows the theme in use as its visible name, and hides the colour drop from screen readers', async () => {
    render(<App />);
    const button = await screen.findByRole('button', { name: /^Theme: Paper/ });

    expect(button).toHaveTextContent('Paper');
    expect(button.querySelector('[data-theme="paper"]')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('choosing a theme from the list', () => {
  async function openList(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
    await user.click(await screen.findByRole('button', { name: 'Choose a theme' }));
    return screen.getByRole('group', { name: 'Theme' });
  }

  it('is closed until it is asked for, and says so', async () => {
    render(<App />);
    const toggle = await screen.findByRole('button', { name: 'Choose a theme' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
  });

  it('lists every theme, with the one in use pressed', async () => {
    const user = userEvent.setup();
    render(<App />);

    const list = await openList(user);

    expect(screen.getByRole('button', { name: 'Choose a theme' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(namesOf(list)).toEqual(['Paper', 'Arcade', 'Seaside', 'Midnight']);
    expect(within(list).getByRole('button', { name: 'Paper' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(list).getByRole('button', { name: 'Seaside' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('goes straight to the theme chosen, saves it and says so', async () => {
    const user = userEvent.setup();
    render(<App />);
    const list = await openList(user);

    await user.click(within(list).getByRole('button', { name: 'Seaside' }));

    expect(pageTheme()).toBe('seaside');
    expect(browserBarColor()).toBe('#e6f6f5');
    expect(savedPreferences()).toEqual({ theme: 'seaside' });
    expect(screen.getByText('Theme changed to Seaside.')).toHaveAttribute('role', 'status');
    expect(
      screen.getByRole('button', { name: 'Theme: Seaside. Switch to Midnight.' }),
    ).toBeVisible();
  });

  it('closes once a theme is chosen, and gives the focus back to the button that opened it', async () => {
    const user = userEvent.setup();
    render(<App />);
    const list = await openList(user);

    await user.click(within(list).getByRole('button', { name: 'Midnight' }));

    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose a theme' })).toHaveFocus();
  });

  it('closes on Escape, with the focus back on the button that opened it', async () => {
    const user = userEvent.setup();
    render(<App />);
    const list = await openList(user);
    within(list).getByRole('button', { name: 'Arcade' }).focus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose a theme' })).toHaveFocus();
    expect(pageTheme()).toBe('paper');
  });

  it('closes when the button that opened it is pressed again', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openList(user);

    await user.click(screen.getByRole('button', { name: 'Choose a theme' }));

    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
  });

  it('closes when something else on the page is pressed', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openList(user);

    await user.click(await screen.findByRole('heading', { name: 'Give every task a time.' }));

    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
    expect(pageTheme()).toBe('paper');
  });

  it('closes when the keyboard leaves it', async () => {
    const user = userEvent.setup();
    render(<App />);
    const list = await openList(user);
    within(list).getByRole('button', { name: 'Midnight' }).focus();

    await user.tab();

    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
  });

  it('names the themes in the language of the screen', async () => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ language: 'es' }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Elegir un tema' }));
    const list = screen.getByRole('group', { name: 'Tema' });

    expect(namesOf(list)).toEqual(['Papel', 'Recreativa', 'Costa', 'Medianoche']);
  });
});
