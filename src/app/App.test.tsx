import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the product name and pitch', () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Agenda' })).toBeInTheDocument();
    expect(screen.getByText(/time-blocking/)).toBeInTheDocument();
  });

  it('announces the API status through a live region', () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    render(<App />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
