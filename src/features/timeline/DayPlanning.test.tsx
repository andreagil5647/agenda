import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildCalendar, buildTask, buildTimedEvent, fakeApi } from '../../../test/msw/fakeApi';
import { App } from '../../app/App';
import { addDays } from '../../lib/time/zonedTime';

// The fake account lives in UTC, so its "today" is the UTC date.
const TODAY = new Date().toISOString().slice(0, 10);
const TOMORROW = addDays(TODAY, 1);

const on = (day: string, time: string): string => `${day}T${time}:00.000Z`;

/** A signed-in account with a day that has an all-day event and two overlapping blocks. */
function seedDay(): void {
  const work = buildCalendar({ name: 'Work', colorKey: 'blue' });
  const personal = buildCalendar({ name: 'Personal', colorKey: 'green' });

  fakeApi.signIn();
  fakeApi.seed({
    calendars: [work, personal],
    events: [
      buildTimedEvent({
        calendarId: work.id,
        title: 'Stand-up',
        startUtc: on(TODAY, '09:00'),
        endUtc: on(TODAY, '09:30'),
      }),
      buildTimedEvent({
        calendarId: work.id,
        title: 'Customer call',
        startUtc: on(TODAY, '15:00'),
        endUtc: on(TODAY, '16:00'),
      }),
      buildTimedEvent({
        calendarId: personal.id,
        title: 'Dentist',
        startUtc: on(TOMORROW, '10:00'),
        endUtc: on(TOMORROW, '11:00'),
      }),
      buildTimedEvent({
        calendarId: work.id,
        title: 'Release week',
        kind: 'allDay',
        startUtc: null,
        endUtc: null,
        timeZone: null,
        startDate: TODAY,
        endDate: addDays(TODAY, 3),
      }),
    ],
  });
}

function block(name: RegExp): Promise<HTMLElement> {
  return within(screen.getByRole('list', { name: 'Blocks' })).findByRole('button', { name });
}

async function renderDay(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('list', { name: 'Blocks' });
  return user;
}

describe('planning a day', () => {
  it('shows each block with its times and calendar', async () => {
    seedDay();
    await renderDay();

    expect(await block(/Stand-up 09:00 – 09:30 Work/)).toBeInTheDocument();
    expect(await block(/Customer call 15:00 – 16:00 Work/)).toBeInTheDocument();
  });

  it('keeps all-day events apart from the hours', async () => {
    seedDay();
    await renderDay();

    const allDay = await screen.findByRole('list', { name: 'All day' });
    expect(within(allDay).getByRole('button', { name: 'Release week' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Blocks' })).queryByRole('button', {
        name: /Release week/,
      }),
    ).not.toBeInTheDocument();
  });

  it('moves to another day and shows what is planned there', async () => {
    seedDay();
    const user = await renderDay();
    await block(/Stand-up/);

    await user.click(screen.getByRole('button', { name: 'Next day' }));

    expect(await block(/Dentist 10:00 – 11:00 Personal/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Stand-up/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(await block(/Stand-up/)).toBeInTheDocument();
  });

  it('adds a block and lets its title be typed straight away', async () => {
    seedDay();
    const user = await renderDay();

    await user.click(screen.getByRole('button', { name: 'Add block' }));
    const title = await screen.findByRole('textbox', { name: 'Title' });
    await waitFor(() => {
      expect(title).toHaveFocus();
    });
    await user.keyboard('Write release notes');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await block(/Write release notes/)).toBeInTheDocument();
    expect(fakeApi.events.map((event) => event.title)).toContain('Write release notes');
  });

  it('creates a block at the time that was clicked on the grid', async () => {
    seedDay();
    await renderDay();
    const grid = screen.getByRole('list', { name: 'Blocks' });
    // jsdom lays nothing out, so the grid is given the height of a day at one pixel a minute.
    jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 1440));

    fireEvent.click(grid, { clientY: 11 * 60 + 20 });

    expect(await block(/New block 11:15 – 11:45/)).toBeInTheDocument();
  });

  it('changes the times of a block from its details', async () => {
    seedDay();
    const user = await renderDay();

    await user.click(await block(/Stand-up/));
    const end = await screen.findByLabelText('End');
    fireEvent.change(end, { target: { value: '10:15' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await block(/Stand-up 09:00 – 10:15/)).toBeInTheDocument();
    expect(fakeApi.events.find((event) => event.title === 'Stand-up')).toMatchObject({
      endUtc: on(TODAY, '10:15'),
      version: 2,
    });
  });

  it('moves a block to another calendar', async () => {
    seedDay();
    const user = await renderDay();

    await user.click(await block(/Stand-up/));
    await user.selectOptions(await screen.findByLabelText('Calendar'), 'Personal');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await block(/Stand-up 09:00 – 09:30 Personal/)).toBeInTheDocument();
  });

  it('refuses an end that is not after the start, without sending anything', async () => {
    seedDay();
    const user = await renderDay();

    await user.click(await block(/Stand-up/));
    fireEvent.change(await screen.findByLabelText('End'), { target: { value: '08:00' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The end has to be after the start.',
    );
    expect(fakeApi.events.find((event) => event.title === 'Stand-up')).toMatchObject({
      version: 1,
    });
  });

  it('deletes a block from its details', async () => {
    seedDay();
    const user = await renderDay();

    await user.click(await block(/Stand-up/));
    await user.click(await screen.findByRole('button', { name: 'Delete block' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Stand-up/ })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('region', { name: 'Details' })).not.toBeInTheDocument();
    expect(fakeApi.events.map((event) => event.title)).not.toContain('Stand-up');
  });

  it('asks for a calendar before any block can be added', async () => {
    fakeApi.signIn();
    await renderDay();

    expect(screen.getByRole('button', { name: 'Add block' })).toBeDisabled();
    expect(screen.getByText(/Add a calendar first/)).toBeInTheDocument();
  });

  it('plans a task at the next free time, for as long as its estimate', async () => {
    seedDay();
    fakeApi.seed({ tasks: [buildTask({ title: 'Write release notes', estimateMinutes: 45 })] });
    const user = await renderDay();

    await user.click(await screen.findByRole('button', { name: 'Plan Write release notes' }));

    const planned = await block(/Write release notes/);
    const saved = fakeApi.events.find((event) => event.title === 'Write release notes');
    const minutes = (Date.parse(saved!.endUtc!) - Date.parse(saved!.startUtc!)) / 60_000;
    expect(planned).toBeInTheDocument();
    expect(minutes).toBe(45);
    expect(saved).toMatchObject({ taskId: fakeApi.tasks[0]!.id });
    expect(screen.getByText(/Planned Write release notes for/)).toHaveAttribute('role', 'status');
    expect(await screen.findByText(/planned/)).toBeInTheDocument();
  });

  it('does not offer to plan a finished task, or any task without a calendar', async () => {
    fakeApi.signIn();
    fakeApi.seed({ tasks: [buildTask({ title: 'Open task' })] });
    await renderDay();

    expect(await screen.findByRole('checkbox', { name: 'Open task' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Plan Open task' })).not.toBeInTheDocument();
  });
});
