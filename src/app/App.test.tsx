import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

const authSession = {
  user: {
    id: 'user_1',
    email: 'andrea@example.com',
    displayName: 'Andrea',
    settings: {
      timeZone: 'UTC',
      weekStartsOn: 1,
      hourCycle: 'h23',
      locale: 'en',
      theme: 'system',
      accentColor: 'blue',
    },
    isDemo: false,
  },
  expiresAt: '2026-11-06T10:00:00.000Z',
  csrfToken: 'csrf-token',
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return createResponse({
    body,
    status,
    contentType: 'application/json',
  });
}

function emptyResponse(status = 204): Response {
  return createResponse({ status });
}

function createResponse({
  body,
  status,
  contentType,
}: {
  body?: unknown;
  status: number;
  contentType?: string;
}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' && contentType ? contentType : null,
    },
    json: () => Promise.resolve(body),
  } as Response;
}

function mockFetch(...responses: Response[]): jest.MockedFunction<typeof fetch> {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  global.fetch = fetchMock;
  return fetchMock;
}

function fetchCall(fetchMock: jest.MockedFunction<typeof fetch>, index: number) {
  const call = fetchMock.mock.calls[index];
  if (!call) {
    throw new Error(`Fetch call ${String(index)} was not made`);
  }

  return call;
}

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  return typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
}

function requestBody(init: RequestInit | undefined): unknown {
  return JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as unknown;
}

describe('App', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('checks the API before bootstrapping the auth session', async () => {
    const fetchMock = mockFetch(jsonResponse({ status: 'ok' }), jsonResponse({ user: null }));

    render(<App />);

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/health$/),
      expect.objectContaining({ signal: expect.any(AbortSignal) as AbortSignal }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/auth\/session$/),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('registers a user and enters the app shell', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ status: 'ok' }),
      jsonResponse({ user: null }),
      jsonResponse(authSession, 201),
    );
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole('tab', { name: 'Create account' }));
    await user.type(screen.getByLabelText('Name'), 'Andrea');
    await user.type(screen.getByLabelText('Email'), 'andrea@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Andrea' })).toBeInTheDocument();

    const [url, init] = fetchCall(fetchMock, 2);
    expect(requestUrl(url)).toMatch(/\/auth\/register$/);
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(requestBody(init)).toEqual({
      displayName: 'Andrea',
      email: 'andrea@example.com',
      password: 'correct horse battery staple',
    });
  });

  it('sends the CSRF token when logging out', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ status: 'ok' }),
      jsonResponse(authSession),
      emptyResponse(),
    );
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole('heading', { name: 'Andrea' });
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    const [url, init] = fetchCall(fetchMock, 2);
    expect(requestUrl(url)).toMatch(/\/auth\/logout$/);
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(init?.headers).toMatchObject({ 'X-CSRF-Token': 'csrf-token' });
  });

  it('shows API errors on the auth form', async () => {
    mockFetch(
      jsonResponse({ status: 'ok' }),
      jsonResponse({ user: null }),
      jsonResponse(
        {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
          requestId: 'req_1',
        },
        401,
      ),
    );
    const user = userEvent.setup();

    render(<App />);

    await user.type(await screen.findByLabelText('Email'), 'andrea@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });
});
