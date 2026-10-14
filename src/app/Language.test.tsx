import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildCalendar, buildTask, buildTimedEvent, fakeApi } from '../../test/msw/fakeApi';
import { App } from './App';

const PREFERENCES_KEY = 'agenda.preferences';

function browserLanguages(languages: readonly string[]): void {
  jest.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages);
}

function saveLanguage(language: 'en' | 'es'): void {
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ language }));
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = '';
  jest.restoreAllMocks();
});

describe('the language of the app', () => {
  it('starts in the language of the browser', async () => {
    browserLanguages(['es-ES', 'en']);
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Dale una hora a cada tarea.' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
  });

  it('is switched from the corner of the sign-in screen, and says which one is in use', async () => {
    const user = userEvent.setup();
    render(<App />);
    const preferences = await screen.findByRole('group', { name: 'Preferences' });

    expect(within(preferences).getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(within(preferences).getByRole('button', { name: 'Español' }));

    expect(
      await screen.findByRole('heading', { name: 'Dale una hora a cada tarea.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Preferencias' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('es');

    await user.click(screen.getByRole('button', { name: 'English' }));

    expect(
      await screen.findByRole('heading', { name: 'Give every task a time.' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('names each language in itself and reads it in itself', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: 'English' })).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute('lang', 'es');
  });

  it('is remembered on the next visit', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Español' }));
    await screen.findByRole('heading', { name: 'Dale una hora a cada tarea.' });
    first.unmount();

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Dale una hora a cada tarea.' }),
    ).toBeInTheDocument();
  });

  it('is the saved one, not the browser one, when the two disagree', async () => {
    browserLanguages(['en-US']);
    saveLanguage('es');
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Dale una hora a cada tarea.' }),
    ).toBeInTheDocument();
  });

  it('also changes a sign-in error that is already on screen', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByLabelText('Email'), 'andrea@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That email and password do not');

    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ese correo y esa contraseña no coinciden.',
    );
  });

  it('keeps what the reader typed when the language changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByLabelText('Email'), 'andrea@example.com');

    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(await screen.findByLabelText('Correo electrónico')).toHaveValue('andrea@example.com');
  });
});

describe('the planner in Spanish', () => {
  function seedPlanner(): void {
    const today = new Date().toISOString().slice(0, 10);
    const calendar = buildCalendar({ name: 'Trabajo' });

    saveLanguage('es');
    fakeApi.signIn();
    fakeApi.seed({
      calendars: [calendar],
      tasks: [buildTask({ title: 'Preparar la lista', estimateMinutes: 45 })],
      events: [
        buildTimedEvent({
          calendarId: calendar.id,
          title: 'Reunión diaria',
          startUtc: `${today}T09:00:00.000Z`,
          endUtc: `${today}T09:30:00.000Z`,
        }),
      ],
    });
  }

  it('shows every panel, label and button in Spanish', async () => {
    seedPlanner();
    render(<App />);

    expect(await screen.findByRole('region', { name: 'Línea de tiempo' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tareas' })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Calendarios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Añadir bloque' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Añadir tarea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Saltar a la agenda' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Planificar Preparar la lista' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 abierta')).toBeInTheDocument();
  });

  it('counts open tasks in the right plural', async () => {
    seedPlanner();
    fakeApi.seed({ tasks: [buildTask({ title: 'Otra tarea' })] });
    render(<App />);

    expect(await screen.findByText('2 abiertas')).toBeInTheDocument();
  });

  it('reads out what happened in Spanish', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Planificar Preparar la lista' }));

    expect(await screen.findByText(/^Planificada Preparar la lista para /)).toHaveAttribute(
      'role',
      'status',
    );
  });

  it('writes the title of a new block in the current language', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Añadir bloque' }));

    expect(await screen.findByRole('textbox', { name: 'Título' })).toHaveValue('Nuevo bloque');
  });
});
