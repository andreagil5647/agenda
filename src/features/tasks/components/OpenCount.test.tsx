import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../../../lib/i18n/I18nProvider';
import { OpenCount } from './OpenCount';

interface Props {
  count: number | undefined;
  readerActions: number;
}

function renderCount(initial: Props): { change: (next: Props) => void } {
  const { rerender } = render(
    <I18nProvider>
      <OpenCount {...initial} />
    </I18nProvider>,
  );
  return {
    change: (next) => {
      rerender(
        <I18nProvider>
          <OpenCount {...next} />
        </I18nProvider>,
      );
    },
  };
}

afterEach(() => {
  window.localStorage.clear();
});

describe('OpenCount', () => {
  it('says how many tasks are open, and nothing while the list is loading', async () => {
    const { change } = renderCount({ count: undefined, readerActions: 0 });
    expect(screen.queryByText(/open/)).not.toBeInTheDocument();

    change({ count: 3, readerActions: 0 });

    expect(await screen.findByText('3 open')).toBeInTheDocument();
  });

  it('does not roll in the number that arrives with the list, even while the reader is writing', async () => {
    const { change } = renderCount({ count: undefined, readerActions: 0 });

    change({ count: 3, readerActions: 1 });

    expect(await screen.findByText('3 open')).not.toHaveAttribute('data-tick');
  });

  it('rolls the new number in from above when the reader makes it go down', async () => {
    const { change } = renderCount({ count: 3, readerActions: 0 });
    await screen.findByText('3 open');

    change({ count: 2, readerActions: 1 });

    expect(await screen.findByText('2 open')).toHaveAttribute('data-tick', 'down');
  });

  it('rolls it in from below when the reader makes it go up', async () => {
    const { change } = renderCount({ count: 2, readerActions: 0 });
    await screen.findByText('2 open');

    change({ count: 3, readerActions: 1 });

    expect(await screen.findByText('3 open')).toHaveAttribute('data-tick', 'up');
  });

  it('does not roll in a number that changed because the list changed somewhere else', async () => {
    const { change } = renderCount({ count: 3, readerActions: 0 });
    await screen.findByText('3 open');

    change({ count: 2, readerActions: 0 });

    expect(await screen.findByText('2 open')).not.toHaveAttribute('data-tick');
  });

  it('does not keep rolling a number once a later change was not the reader', async () => {
    const { change } = renderCount({ count: 3, readerActions: 0 });
    await screen.findByText('3 open');
    change({ count: 2, readerActions: 1 });
    await screen.findByText('2 open');

    change({ count: 3, readerActions: 1 });

    expect(await screen.findByText('3 open')).not.toHaveAttribute('data-tick');
  });
});
