import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setDevice } from '../../../test/helpers/device';
import { buildCalendar, buildTask, buildTimedEvent, fakeApi } from '../../../test/msw/fakeApi';
import { server } from '../../../test/msw/server';
import { App } from '../../app/App';

const TODAY = new Date().toISOString().slice(0, 10);

function seed(): void {
  const work = buildCalendar({ name: 'Work', colorKey: 'blue' });
  fakeApi.signIn();
  fakeApi.seed({
    calendars: [work],
    tasks: [buildTask({ title: 'Open task' })],
    events: [
      buildTimedEvent({
        calendarId: work.id,
        title: 'Stand-up',
        startUtc: `${TODAY}T09:00:00.000Z`,
        endUtc: `${TODAY}T09:30:00.000Z`,
      }),
    ],
  });
}

async function renderDay(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('list', { name: 'Blocks' });
  return user;
}

function block(name: RegExp): Promise<HTMLElement> {
  return within(screen.getByRole('list', { name: 'Blocks' })).findByRole('button', { name });
}

/** The element a block's animations are on, which is what finishes when they do. */
function itemOf(button: HTMLElement): HTMLElement {
  const item = button.closest('li');
  if (!item) throw new Error('A block is not in a list item.');
  return item;
}

function leaving(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-leaving]');
}

describe('a block arriving', () => {
  it('is not arriving when the day loads', async () => {
    seed();
    await renderDay();
    await block(/Stand-up/);

    expect(document.querySelector('[data-arrival]')).not.toBeInTheDocument();
  });

  it('grows when the reader adds one, and is done once it has', async () => {
    seed();
    const user = await renderDay();

    await user.click(screen.getByRole('button', { name: 'Add block' }));
    const item = itemOf(await block(/New block/));

    expect(item).toHaveAttribute('data-arrival', 'grow');

    fireEvent.animationEnd(item);

    expect(item).not.toHaveAttribute('data-arrival');
  });

  it('grows when the reader gives a task its time with the Plan button', async () => {
    seed();
    const user = await renderDay();

    await user.click(await screen.findByRole('button', { name: 'Plan Open task' }));

    expect(itemOf(await block(/Open task/))).toHaveAttribute('data-arrival', 'grow');
  });

  it('does not play again when the block is saved, and is never cut short by it', async () => {
    seed();
    let release = (): void => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post('*/api/v1/events', async () => {
        await gate;
        // No answer here: the request goes on to the fake API.
      }),
    );
    const user = await renderDay();

    await user.click(screen.getByRole('button', { name: 'Add block' }));
    const item = itemOf(await block(/New block/));
    release();
    await waitFor(() => {
      expect(within(item).getByRole('button')).toHaveAttribute('aria-busy', 'false');
    });

    // Still the same element, still arriving: the saved block carried on where it was.
    expect(item).toBeInTheDocument();
    expect(item).toHaveAttribute('data-arrival', 'grow');
  });

  it('does not arrive for a reader who asked for less motion', async () => {
    seed();
    setDevice({ reducedMotion: true });
    const user = await renderDay();

    await user.click(screen.getByRole('button', { name: 'Add block' }));
    await block(/New block/);

    expect(document.querySelector('[data-arrival]')).not.toBeInTheDocument();
  });
});

describe('a block leaving', () => {
  async function deleteWithKey(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    const standUp = await block(/Stand-up/);
    standUp.focus();
    await user.keyboard('{Delete}');
  }

  it('shrinks away when the reader deletes it, and is gone once it has', async () => {
    seed();
    const user = await renderDay();

    await deleteWithKey(user);

    // The block itself is gone at once, and can no longer be reached.
    expect(screen.queryByRole('button', { name: /Stand-up/ })).not.toBeInTheDocument();
    // A picture of it stays for a moment, hidden from assistive technology.
    const ghost = leaving();
    expect(ghost).toHaveTextContent('Stand-up');
    expect(ghost).toHaveAttribute('aria-hidden', 'true');
    expect(within(ghost!).queryByRole('button')).not.toBeInTheDocument();

    fireEvent.animationEnd(ghost!);

    expect(leaving()).not.toBeInTheDocument();
  });

  it('also does when it is deleted from the details panel, and says so', async () => {
    seed();
    const user = await renderDay();

    await user.click(await block(/Stand-up/));
    await user.click(await screen.findByRole('button', { name: 'Delete block' }));

    expect(screen.queryByRole('button', { name: /Stand-up/ })).not.toBeInTheDocument();
    expect(leaving()).toHaveTextContent('Stand-up');
    expect(screen.getByText('Deleted Stand-up.')).toHaveAttribute('role', 'status');
  });

  it('is not left on screen when the server refuses and the block comes back', async () => {
    seed();
    server.use(
      http.delete('*/api/v1/events/:id', () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side', requestId: 'r' },
          { status: 500 },
        ),
      ),
    );
    const user = await renderDay();

    await deleteWithKey(user);

    expect(await block(/Stand-up/)).toBeInTheDocument();
    expect(leaving()).not.toBeInTheDocument();
  });

  it('does not leave a picture behind for a reader who asked for less motion', async () => {
    seed();
    setDevice({ reducedMotion: true });
    const user = await renderDay();

    await deleteWithKey(user);

    expect(screen.queryByRole('button', { name: /Stand-up/ })).not.toBeInTheDocument();
    expect(leaving()).not.toBeInTheDocument();
  });
});
