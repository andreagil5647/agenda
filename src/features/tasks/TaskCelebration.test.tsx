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

describe('finishing the last open task', () => {
  const PRAISE = 'Every task is done. Enjoy the rest of your day.';

  function twoTasks(): void {
    seedTasks(buildTask({ title: 'Draft launch checklist' }), buildTask({ title: 'Send invoice' }));
  }

  it('is a bigger moment than finishing any other, with a line of praise that is read out', async () => {
    twoTasks();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('checkbox', { name: /Draft launch checklist/ }));
    await waitFor(() => {
      expect(burst()).toHaveAttribute('data-size', 'small');
    });
    expect(screen.queryByText(PRAISE)).not.toBeInTheDocument();
    fireEvent.animationEnd(burst()?.firstElementChild ?? document.body);

    await user.click(screen.getByRole('checkbox', { name: /Send invoice/ }));

    await waitFor(() => {
      expect(burst()).toHaveAttribute('data-size', 'large');
    });
    expect(burst()?.children).toHaveLength(12);
    const praise = await screen.findByText(PRAISE);
    expect(praise).toHaveAttribute('role', 'status');
    expect(praise).toHaveAttribute('data-moment');
  });

  it('keeps the line, but plays nothing, for a list that was already clear when it loaded', async () => {
    seedTasks(buildTask({ status: 'done' }));
    render(<App />);

    const praise = await screen.findByText(PRAISE);

    expect(praise).not.toHaveAttribute('data-moment');
    expect(burst()).not.toBeInTheDocument();
  });

  it('takes the line away when a task is opened again', async () => {
    seedTasks(buildTask({ title: 'Send invoice' }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('checkbox', { name: /Send invoice/ }));
    await screen.findByText(PRAISE);

    await user.click(screen.getByRole('checkbox', { name: /Send invoice/ }));

    await waitFor(() => {
      expect(screen.queryByText(PRAISE)).not.toBeInTheDocument();
    });
  });

  it('is not left waiting when the server refuses the last task, whatever finishes it later', async () => {
    seedTasks(buildTask({ title: 'Send invoice' }));
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

    await user.click(await screen.findByRole('checkbox', { name: /Send invoice/ }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Send invoice/ })).not.toBeChecked();
    expect(screen.queryByText(PRAISE)).not.toBeInTheDocument();
    expect(burst()).not.toBeInTheDocument();
  });

  it('says it in Spanish too', async () => {
    window.localStorage.setItem('agenda.preferences', JSON.stringify({ language: 'es' }));
    seedTasks(buildTask({ status: 'done' }));
    render(<App />);

    expect(
      await screen.findByText('Todas las tareas están hechas. Disfruta del resto del día.'),
    ).toBeInTheDocument();
    window.localStorage.clear();
  });
});

describe('the number of open tasks', () => {
  it('counts down when the reader finishes a task, and up when they add one', async () => {
    seedTasks(buildTask({ title: 'Draft launch checklist' }), buildTask({ title: 'Send invoice' }));
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('2 open')).not.toHaveAttribute('data-tick');

    await user.click(screen.getByRole('checkbox', { name: /Send invoice/ }));
    expect(await screen.findByText('1 open')).toHaveAttribute('data-tick', 'down');

    await user.type(screen.getByRole('textbox', { name: 'New task' }), 'Water the plants');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    expect(await screen.findByText('2 open')).toHaveAttribute('data-tick', 'up');
  });
});
