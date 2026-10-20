import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setDevice } from '../../../test/helpers/device';
import { buildCalendar, fakeApi } from '../../../test/msw/fakeApi';
import { App } from '../../app/App';

function slide(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slide]');
}

async function renderDay(): Promise<ReturnType<typeof userEvent.setup>> {
  fakeApi.signIn();
  fakeApi.seed({ calendars: [buildCalendar({ name: 'Work' })] });
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('list', { name: 'Blocks' });
  return user;
}

describe('changing the day', () => {
  it('does not slide the day that is shown when the page loads', async () => {
    await renderDay();

    expect(slide()).not.toBeInTheDocument();
  });

  it('slides in from the right when the reader goes to the next day, and is done once it has', async () => {
    const user = await renderDay();

    await user.click(screen.getByRole('button', { name: 'Next day' }));

    await waitFor(() => {
      expect(slide()).toHaveAttribute('data-slide', 'forward');
    });
    fireEvent.animationEnd(slide()!);
    expect(slide()).not.toBeInTheDocument();
  });

  it('slides in from the left when the reader goes back', async () => {
    const user = await renderDay();

    await user.click(screen.getByRole('button', { name: 'Previous day' }));

    await waitFor(() => {
      expect(slide()).toHaveAttribute('data-slide', 'back');
    });
  });

  it('does not slide for a reader who asked for less motion, and still changes the day', async () => {
    setDevice({ reducedMotion: true });
    const user = await renderDay();
    const heading = screen.getByRole('heading', { level: 1 });
    const before = heading.textContent;

    await user.click(screen.getByRole('button', { name: 'Next day' }));

    await waitFor(() => {
      expect(heading.textContent).not.toBe(before);
    });
    await screen.findByRole('list', { name: 'Blocks' });
    expect(slide()).not.toBeInTheDocument();
  });
});
