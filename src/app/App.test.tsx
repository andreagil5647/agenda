import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { buildCalendar, buildTask, buildTimedEvent, fakeApi } from '../../test/msw/fakeApi';
import { server } from '../../test/msw/server';
import { App } from './App';

/** A signed-in account with one calendar, one task and one block on the current day. */
function seedPlanner(): void {
  const calendar = buildCalendar({ name: 'Work' });
  const today = new Date().toISOString().slice(0, 10);

  fakeApi.signIn();
  fakeApi.seed({
    calendars: [calendar],
    tasks: [buildTask({ title: 'Draft launch checklist', estimateMinutes: 60 })],
    events: [
      buildTimedEvent({
        calendarId: calendar.id,
        title: 'Focus block',
        startUtc: `${today}T09:00:00.000Z`,
        endUtc: `${today}T10:00:00.000Z`,
      }),
    ],
  });
}

describe('App', () => {
  it('shows the sign-in form to a visitor without a session', async () => {
    render(<App />);

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try the demo' })).toBeInTheDocument();
  });

  it('switches between logging in and creating an account', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Create an account' }));

    expect(screen.getByRole('form', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('form', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('lets the keyboard skip the navigation and go straight to the planner', async () => {
    fakeApi.signIn();
    render(<App />);

    const skipLink = await screen.findByRole('link', { name: 'Skip to the planner' });

    expect(skipLink).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('says what to do when there are no tasks or calendars yet', async () => {
    fakeApi.signIn();
    render(<App />);

    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
    expect(screen.getByText('No calendars yet')).toBeInTheDocument();
  });

  it('registers a user and enters the planner', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Name'), 'Andrea');
    await user.type(screen.getByLabelText('Email'), 'andrea@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Account' })).toHaveTextContent('Andrea');
  });

  it('starts a demo session in one click', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Try the demo' }));

    expect(await screen.findByText(/Demo account/)).toBeInTheDocument();
  });

  it('shows why a sign-in failed', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(await screen.findByLabelText('Email'), 'andrea@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email and password do not match.',
    );
  });

  it('logs out and returns to the sign-in form', async () => {
    fakeApi.signIn();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
  });

  it('shows the calendars, tasks and blocks of a signed-in user', async () => {
    seedPlanner();
    render(<App />);

    const timeline = await screen.findByRole('region', { name: 'Timeline' });
    expect(await within(timeline).findByText('Focus block')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Tasks' })).getByRole('list'),
    ).toHaveTextContent('Draft launch checklist');
    expect(await screen.findByRole('region', { name: 'Calendars' })).toHaveTextContent('Work');
  });

  it('adds a task to the list', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);

    const tasks = await screen.findByRole('region', { name: 'Tasks' });
    await within(tasks).findByText('Draft launch checklist');
    await user.type(within(tasks).getByPlaceholderText('New task'), 'Write tests');
    await user.click(within(tasks).getByRole('button', { name: 'Add task' }));

    expect(await within(tasks).findByRole('checkbox', { name: /Write tests/ })).not.toBeChecked();
    expect(within(tasks).getByPlaceholderText('New task')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fakeApi.tasks.map((task) => task.title)).toContain('Write tests');
  });

  it('completes a task', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('checkbox', { name: /Draft launch checklist/ }));

    expect(await screen.findByRole('checkbox', { name: /Draft launch checklist/ })).toBeChecked();
    expect(fakeApi.tasks[0]).toMatchObject({ status: 'done', version: 2 });
  });

  it('applies two quick changes to the same task in order', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);

    const checkbox = await screen.findByRole('checkbox', { name: /Draft launch checklist/ });
    await user.click(checkbox);
    await user.click(checkbox);

    await waitFor(() => {
      expect(fakeApi.tasks[0]).toMatchObject({ status: 'todo', version: 3 });
    });
    expect(screen.getByRole('checkbox', { name: /Draft launch checklist/ })).not.toBeChecked();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('deletes a task', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Delete Draft launch checklist' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('checkbox', { name: /Draft launch checklist/ }),
      ).not.toBeInTheDocument();
    });
    expect(fakeApi.tasks).toHaveLength(0);
  });

  it('refuses to overwrite a task that changed somewhere else, and says so', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);

    const checkbox = await screen.findByRole('checkbox', { name: /Draft launch checklist/ });
    const [task] = fakeApi.tasks;
    fakeApi.editTaskElsewhere(task!.id, { title: 'Renamed in another tab' });
    await user.click(checkbox);

    expect(await screen.findByRole('alert')).toHaveTextContent(/changed somewhere else/);
    expect(
      await screen.findByRole('checkbox', { name: /Renamed in another tab/ }),
    ).not.toBeChecked();
    expect(fakeApi.tasks[0]).toMatchObject({ title: 'Renamed in another tab', status: 'todo' });
  });

  it('says so when the server cannot be reached', async () => {
    server.use(http.get('*/api/v1/auth/session', () => HttpResponse.error()));
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not reach the server/);
  });

  it('takes a change back when the server refuses it', async () => {
    seedPlanner();
    server.use(
      http.patch('*/api/v1/tasks/:id', () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side', requestId: 'r' },
          { status: 500 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('checkbox', { name: /Draft launch checklist/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Something went wrong/);
    expect(screen.getByRole('checkbox', { name: /Draft launch checklist/ })).not.toBeChecked();
  });

  it('dismisses a notice', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);
    const checkbox = await screen.findByRole('checkbox', { name: /Draft launch checklist/ });
    fakeApi.editTaskElsewhere(fakeApi.tasks[0]!.id, { title: 'Renamed in another tab' });
    await user.click(checkbox);

    await user.click(await screen.findByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers to try again when the planner cannot be loaded', async () => {
    seedPlanner();
    server.use(
      http.get(
        '*/api/v1/tasks',
        () =>
          HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side', requestId: 'r' },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('checkbox', { name: /Draft launch checklist/ })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('returns to the sign-in form when the session has ended', async () => {
    seedPlanner();
    const user = userEvent.setup();
    render(<App />);
    const checkbox = await screen.findByRole('checkbox', { name: /Draft launch checklist/ });

    fakeApi.endSession();
    await user.click(checkbox);

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/session has ended/);
  });
});
