import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildCalendar, buildTask, buildTimedEvent, fakeApi } from '../../test/msw/fakeApi';
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
    expect(screen.getByRole('button', { name: 'Try demo' })).toBeInTheDocument();
  });

  it('registers a user and enters the planner', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('tab', { name: 'Create account' }));
    await user.type(screen.getByLabelText('Name'), 'Andrea');
    await user.type(screen.getByLabelText('Email'), 'andrea@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Andrea' })).toBeInTheDocument();
  });

  it('starts a demo session in one click', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Try demo' }));

    expect(await screen.findByRole('heading', { name: 'Demo User' })).toBeInTheDocument();
  });

  it('shows why a sign-in failed', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(await screen.findByLabelText('Email'), 'andrea@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
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
    expect(screen.getByRole('region', { name: 'Sources' })).toHaveTextContent('Work');
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
});
