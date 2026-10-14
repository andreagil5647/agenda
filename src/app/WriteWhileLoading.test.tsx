import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { buildCalendar, buildTask, fakeApi } from '../../test/msw/fakeApi';
import { server } from '../../test/msw/server';
import { App } from './App';

/**
 * Holds the first read of a list open until the returned function is called, so that a person
 * can write to the list while it is still loading. `readAt` says when the API reads what it
 * answers with: "before" is a read that started before the write and so does not have it.
 */
function holdReadsOf(
  path: 'tasks' | 'calendars',
  read: () => readonly unknown[],
  readAt: 'before' | 'after',
): () => void {
  let release = (): void => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.get(`*/api/v1/${path}`, async () => {
      const early = structuredClone(read());
      await gate;
      return HttpResponse.json(readAt === 'before' ? early : read());
    }),
  );
  return release;
}

function seed(): void {
  fakeApi.signIn();
  fakeApi.seed({
    calendars: [buildCalendar({ name: 'Work' })],
    tasks: [buildTask({ title: 'Draft launch checklist' })],
  });
}

describe('writing to a list that is still loading', () => {
  it.each(['before', 'after'] as const)(
    'adds the task and shows the list once it has loaded, whether it was read %s the write',
    async (readAt) => {
      seed();
      const release = holdReadsOf('tasks', () => fakeApi.tasks, readAt);
      const user = userEvent.setup();
      render(<App />);

      await user.type(await screen.findByRole('textbox', { name: 'New task' }), 'Water the plants');
      await user.click(screen.getByRole('button', { name: 'Add task' }));
      await waitFor(() => {
        expect(fakeApi.tasks.map((task) => task.title)).toContain('Water the plants');
      });
      release();

      expect(await screen.findByRole('checkbox', { name: 'Water the plants' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Draft launch checklist' })).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox', { name: 'Water the plants' })).toHaveLength(1);
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    },
  );

  it('does the same for calendars', async () => {
    seed();
    const release = holdReadsOf('calendars', () => fakeApi.calendars, 'before');
    const user = userEvent.setup();
    render(<App />);

    await user.type(await screen.findByRole('textbox', { name: 'New calendar' }), 'Travel');
    await user.click(screen.getByRole('button', { name: 'Add calendar' }));
    await waitFor(() => {
      expect(fakeApi.calendars.map((calendar) => calendar.name)).toContain('Travel');
    });
    release();

    const calendars = await screen.findByRole('region', { name: 'Calendars' });
    expect(await within(calendars).findByText('Travel')).toBeInTheDocument();
    expect(within(calendars).getByText('Work')).toBeInTheDocument();
    expect(screen.queryByText('Loading calendars...')).not.toBeInTheDocument();
  });
});
