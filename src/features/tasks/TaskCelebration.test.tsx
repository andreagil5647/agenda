import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { App } from '../../app/App';
import { buildCalendar, buildTask, fakeApi } from '../../../test/msw/fakeApi';
import { server } from '../../../test/msw/server';

const TITLE = /Draft launch checklist/;

function seedTasks(...tasks: ReturnType<typeof buildTask>[]): void {
  fakeApi.signIn();
  fakeApi.seed({ calendars: [buildCalendar({ name: 'Work' })], tasks });
}

/** The burst of marks that flies out of a finished task, which only the eye can see. */
function burst(): Element | null {
  return document.querySelector('[data-burst]');
}

async function finishTask(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(await screen.findByRole('checkbox', { name: TITLE }));
}

describe('finishing a task', () => {
  it('plays a burst from its tick box', async () => {
    seedTasks(buildTask());
    const user = userEvent.setup();
    render(<App />);

    await finishTask(user);

    await waitFor(() => {
      expect(burst()).toBeInTheDocument();
    });
    expect(screen.getByRole('checkbox', { name: TITLE })).toBeChecked();
  });

  it('is only for the eye: the burst is hidden from assistive technology', async () => {
    seedTasks(buildTask());
    const user = userEvent.setup();
    render(<App />);

    await finishTask(user);

    await waitFor(() => {
      expect(burst()).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('plays nothing for a task that was already finished when the list loaded', async () => {
    seedTasks(buildTask({ status: 'done' }));
    render(<App />);

    expect(await screen.findByRole('checkbox', { name: TITLE })).toBeChecked();
    expect(burst()).not.toBeInTheDocument();
  });

  it('takes the burst away once it has played', async () => {
    seedTasks(buildTask());
    const user = userEvent.setup();
    render(<App />);
    await finishTask(user);
    await waitFor(() => {
      expect(burst()).toBeInTheDocument();
    });

    fireEvent.animationEnd(burst()?.firstElementChild ?? document.body);

    expect(burst()).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: TITLE })).toBeChecked();
  });

  it('plays nothing when the task is opened again, and plays again when it is finished again', async () => {
    seedTasks(buildTask());
    const user = userEvent.setup();
    render(<App />);
    await finishTask(user);
    await waitFor(() => {
      expect(burst()).toBeInTheDocument();
    });
    fireEvent.animationEnd(burst()?.firstElementChild ?? document.body);

    await user.click(screen.getByRole('checkbox', { name: TITLE }));
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: TITLE })).not.toBeChecked();
    });
    expect(burst()).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: TITLE }));
    await waitFor(() => {
      expect(burst()).toBeInTheDocument();
    });
  });

  it('takes the burst back with the change when the server refuses it', async () => {
    seedTasks(buildTask());
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

    await finishTask(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Something went wrong/);
    expect(screen.getByRole('checkbox', { name: TITLE })).not.toBeChecked();
    expect(burst()).not.toBeInTheDocument();
  });
});
