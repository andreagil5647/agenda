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

const calendar = {
  id: '507f1f77bcf86cd799439011',
  name: 'Work',
  colorKey: 'blue',
  visible: true,
  defaultReminderMinutes: [10],
  order: 1,
  version: 1,
  createdAt: '2026-10-08T08:00:00.000Z',
  updatedAt: '2026-10-08T08:00:00.000Z',
} as const;

const task = {
  id: '507f1f77bcf86cd799439012',
  title: 'Draft launch checklist',
  dueDate: '2026-10-08',
  priority: 'high',
  status: 'todo',
  estimateMinutes: 60,
  order: 'a0',
  version: 1,
  createdAt: '2026-10-08T08:00:00.000Z',
  updatedAt: '2026-10-08T08:00:00.000Z',
} as const;

const eventBlock = {
  id: '507f1f77bcf86cd799439013',
  calendarId: calendar.id,
  title: 'Focus block',
  notes: null,
  taskId: task.id,
  kind: 'timed',
  startUtc: '2026-10-08T09:00:00.000Z',
  endUtc: '2026-10-08T10:00:00.000Z',
  timeZone: 'Europe/Madrid',
  startDate: null,
  endDate: null,
  version: 1,
  createdAt: '2026-10-08T08:00:00.000Z',
  updatedAt: '2026-10-08T08:00:00.000Z',
} as const;

interface PlannerPayload {
  calendars: readonly unknown[];
  tasks: readonly unknown[];
  events: readonly unknown[];
}

function plannerResponses({
  calendars = [calendar],
  tasks = [task],
  events = [eventBlock],
}: Partial<PlannerPayload> = {}): Response[] {
  return [jsonResponse(calendars), jsonResponse(tasks), jsonResponse(events)];
}

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

function findFetchCall(
  fetchMock: jest.MockedFunction<typeof fetch>,
  predicate: (url: string, init: RequestInit | undefined) => boolean,
) {
  const call = fetchMock.mock.calls.find(([input, init]) => predicate(requestUrl(input), init));
  if (!call) {
    throw new Error('Expected fetch call was not made');
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
      ...plannerResponses(),
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
      ...plannerResponses(),
      emptyResponse(),
    );
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole('heading', { name: 'Andrea' });
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    const [url, init] = findFetchCall(
      fetchMock,
      (requestUrl, requestInit) =>
        requestUrl.endsWith('/auth/logout') && requestInit?.method === 'POST',
    );
    expect(requestUrl(url)).toMatch(/\/auth\/logout$/);
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(init?.headers).toMatchObject({ 'X-CSRF-Token': 'csrf-token' });
  });

  it('loads planner resources for an authenticated session', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ status: 'ok' }),
      jsonResponse(authSession),
      ...plannerResponses(),
    );

    render(<App />);

    expect(await screen.findByText('Focus block')).toBeInTheDocument();
    expect(screen.getAllByText('Draft launch checklist').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);

    expect(findFetchCall(fetchMock, (url) => url.endsWith('/calendars'))).toBeDefined();
    expect(findFetchCall(fetchMock, (url) => url.endsWith('/tasks'))).toBeDefined();
    expect(findFetchCall(fetchMock, (url) => url.includes('/events?from='))).toBeDefined();
  });

  it('sends the CSRF token when creating planner tasks', async () => {
    const createdTask = { ...task, id: '507f1f77bcf86cd799439014', title: 'Write tests' };
    const fetchMock = mockFetch(
      jsonResponse({ status: 'ok' }),
      jsonResponse(authSession),
      ...plannerResponses(),
      jsonResponse(createdTask, 201),
      ...plannerResponses({ tasks: [task, createdTask] }),
    );
    const user = userEvent.setup();

    render(<App />);

    await screen.findAllByText('Draft launch checklist');
    await user.type(screen.getByPlaceholderText('New task'), 'Write tests');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => {
      expect(
        findFetchCall(fetchMock, (url, init) => url.endsWith('/tasks') && init?.method === 'POST'),
      ).toBeDefined();
    });

    const [, init] = findFetchCall(
      fetchMock,
      (url, requestInit) => url.endsWith('/tasks') && requestInit?.method === 'POST',
    );
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(init?.headers).toMatchObject({ 'X-CSRF-Token': 'csrf-token' });
    expect(requestBody(init)).toMatchObject({
      title: 'Write tests',
      priority: 'medium',
      estimateMinutes: 30,
    });
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
