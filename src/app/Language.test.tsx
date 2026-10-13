import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import {
  buildCalendar,
  buildTask,
  buildTimedEvent,
  buildUser,
  fakeApi,
} from '../../test/msw/fakeApi';
import { server } from '../../test/msw/server';
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

  it('writes the day and the length of a task in Spanish, whatever the account says', async () => {
    seedPlanner();
    fakeApi.seed({ tasks: [buildTask({ title: 'Una hora', estimateMinutes: 60 })] });
    render(<App />);

    await screen.findByRole('region', { name: 'Línea de tiempo' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /^\p{L}+, \d{1,2} de \p{L}+$/u,
    );
    expect(await screen.findByText('1 h')).toBeInTheDocument();
  });

  it('writes 12-hour times with the Spanish period of the day', async () => {
    seedPlanner();
    const { settings } = buildUser();
    fakeApi.signIn(buildUser({ settings: { ...settings, hourCycle: 'h12' } }));
    render(<App />);

    expect(await screen.findAllByText(/\d:\d{2}\sa\.\sm\./)).not.toHaveLength(0);
    expect(screen.getAllByText(/\d:\d{2}\sp\.\sm\./)).not.toHaveLength(0);
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

describe('signing up and trying the demo', () => {
  const ENGLISH_SENTENCE_FROM_THE_API = 'Written in English, for logs';

  function refuse(path: string, status: number, code: string, reason: string): void {
    server.use(
      http.post(`*/api/v1/auth/${path}`, () =>
        HttpResponse.json(
          { code, message: ENGLISH_SENTENCE_FROM_THE_API, details: { reason }, requestId: 'r' },
          { status },
        ),
      ),
    );
  }

  async function fillInAndCreateAccount(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    await user.click(await screen.findByRole('button', { name: 'Crear una cuenta' }));
    await user.type(screen.getByLabelText('Nombre'), 'Andrea');
    await user.type(screen.getByLabelText('Correo electrónico'), 'andrea@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  }

  it('starts the demo in the language of the screen', async () => {
    saveLanguage('es');
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Probar la demo' }));

    await screen.findByRole('button', { name: 'Cerrar sesión' });
    expect(fakeApi.user?.settings.locale).toBe('es');
  });

  it('starts a new account in the language of the screen', async () => {
    saveLanguage('es');
    const user = userEvent.setup();
    render(<App />);

    await fillInAndCreateAccount(user);

    await screen.findByRole('button', { name: 'Cerrar sesión' });
    expect(fakeApi.user?.settings.locale).toBe('es');
  });

  it('starts in English when that is the language of the screen', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Try the demo' }));

    await screen.findByRole('button', { name: 'Log out' });
    expect(fakeApi.user?.settings.locale).toBe('en');
  });

  it('explains in Spanish that an email is already registered', async () => {
    saveLanguage('es');
    refuse('register', 409, 'CONFLICT', 'email_taken');
    const user = userEvent.setup();
    render(<App />);

    await fillInAndCreateAccount(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Ese correo ya está registrado. Prueba a iniciar sesión.');
    expect(alert).not.toHaveTextContent(ENGLISH_SENTENCE_FROM_THE_API);
  });

  it('explains in Spanish that the demo is full', async () => {
    saveLanguage('es');
    refuse('demo', 429, 'RATE_LIMITED', 'demo_full');
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Probar la demo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La demo está llena ahora mismo. Inténtalo de nuevo en unos minutos.',
    );
  });
});
