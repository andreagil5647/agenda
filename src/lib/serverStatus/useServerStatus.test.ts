import { act, renderHook, waitFor } from '@testing-library/react';
import { useServerStatus } from './useServerStatus';

describe('useServerStatus', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reports ready as soon as the health check succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useServerStatus());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
  });

  it('calls the health endpoint under the configured API base', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    renderHook(() => useServerStatus());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/health$/), expect.anything());
    });
  });

  it('treats a non-ok response the same as a network failure', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    const { result } = renderHook(() => useServerStatus());

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(result.current.status).not.toBe('ready');
    jest.useRealTimers();
  });

  it('moves to "waking" once retries pass the warm-server threshold', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useServerStatus());

    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.status).toBe('waking');
    jest.useRealTimers();
  });

  it('gives up after the retry budget is exhausted', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useServerStatus());

    // The retry chain's own delays can overshoot the 90s budget by up to one
    // step (8s) before a check actually observes elapsed >= the budget, so
    // this advances comfortably past that worst case.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(100_000);
    });

    expect(result.current.status).toBe('error');
    jest.useRealTimers();
  });

  it('stops retrying after unmount', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    const fetchMock = jest.fn().mockRejectedValue(new Error('network error'));
    global.fetch = fetchMock;

    const { unmount } = renderHook(() => useServerStatus());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(500);
    });
    const callsBeforeUnmount = fetchMock.mock.calls.length;

    unmount();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(20_000);
    });

    expect(fetchMock.mock.calls.length).toBe(callsBeforeUnmount);
    jest.useRealTimers();
  });
});
