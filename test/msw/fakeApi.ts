import { http, HttpResponse, type HttpHandler } from 'msw';
import type { components } from '../../src/lib/api/schema';

type Schemas = components['schemas'];
type Calendar = Schemas['Calendar'];
type Task = Schemas['Task'];
type PlannerEvent = Schemas['Event'];
type AuthUser = Schemas['AuthUser'];
type ErrorCode = Schemas['ErrorResponse']['code'];

const API = '*/api/v1';
const CREATED_AT = '2026-10-12T08:00:00.000Z';
const SESSION_EXPIRES_AT = '2026-11-11T08:00:00.000Z';
const CSRF_COOKIE = 'agenda_csrf';
const CSRF_TOKEN = 'test-csrf-token';

/**
 * An in-memory stand-in for the API, served through MSW. It follows the
 * contract closely enough that the app cannot tell the difference: sessions,
 * the CSRF header on writes, and If-Match on changes to existing resources.
 */
interface FakeApiState {
  user: AuthUser | null;
  calendars: Calendar[];
  tasks: Task[];
  events: PlannerEvent[];
  nextId: number;
}

const state: FakeApiState = { user: null, calendars: [], tasks: [], events: [], nextId: 1 };

function nextId(): string {
  const id = state.nextId.toString(16).padStart(24, '0');
  state.nextId += 1;
  return id;
}

const metadata = (): { id: string; version: number; createdAt: string; updatedAt: string } => ({
  id: nextId(),
  version: 1,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
});

export function buildUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: nextId(),
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
    ...overrides,
  };
}

export function buildCalendar(overrides: Partial<Calendar> = {}): Calendar {
  return {
    ...metadata(),
    name: 'Work',
    colorKey: 'blue',
    visible: true,
    defaultReminderMinutes: [],
    order: state.calendars.length,
    ...overrides,
  };
}

export function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    ...metadata(),
    title: 'Draft launch checklist',
    dueDate: null,
    priority: 'none',
    status: 'todo',
    estimateMinutes: 30,
    order: String(state.tasks.length).padStart(4, '0'),
    ...overrides,
  };
}

export function buildTimedEvent(overrides: Partial<PlannerEvent> = {}): PlannerEvent {
  return {
    ...metadata(),
    calendarId: state.calendars[0]?.id ?? nextId(),
    title: 'Focus block',
    notes: null,
    taskId: null,
    kind: 'timed',
    startUtc: '2026-10-12T09:00:00.000Z',
    endUtc: '2026-10-12T10:00:00.000Z',
    timeZone: 'UTC',
    startDate: null,
    endDate: null,
    ...overrides,
  };
}

function errorResponse(status: number, code: ErrorCode, message: string): Response {
  return HttpResponse.json({ code, message, requestId: 'req_test' }, { status });
}

const unauthorized = (): Response => errorResponse(401, 'UNAUTHORIZED', 'Authentication required');
const notFound = (resource: string): Response =>
  errorResponse(404, 'NOT_FOUND', `${resource} not found`);

/** Opens a session: the API sets a script-readable CSRF cookie next to the session one. */
function openSession(user: AuthUser): AuthUser {
  state.user = user;
  document.cookie = `${CSRF_COOKIE}=${CSRF_TOKEN}; path=/`;
  return user;
}

function closeSession(): void {
  state.user = null;
  document.cookie = `${CSRF_COOKIE}=; path=/; max-age=0`;
}

function sessionBody(user: AuthUser): Schemas['AuthenticatedSession'] {
  return { user, expiresAt: SESSION_EXPIRES_AT, csrfToken: CSRF_TOKEN };
}

/** The checks every write goes through before it reaches a resource. */
function rejectWrite(request: Request): Response | null {
  if (!state.user) return unauthorized();
  if (request.headers.get('X-CSRF-Token') !== CSRF_TOKEN) {
    return errorResponse(403, 'FORBIDDEN', 'CSRF token is missing or invalid');
  }
  return null;
}

/** The precondition a change to an existing resource has to meet. */
function rejectStale(
  request: Request,
  resource: { version: number },
  name: string,
): Response | null {
  const ifMatch = request.headers.get('If-Match');
  if (ifMatch === null) {
    return errorResponse(428, 'PRECONDITION_REQUIRED', 'If-Match header is required');
  }
  if (ifMatch !== `"${String(resource.version)}"`) {
    return errorResponse(412, 'PRECONDITION_FAILED', `${name} was changed by another request`);
  }
  return null;
}

async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json();
  return typeof body === 'object' && body !== null ? { ...body } : {};
}

function versioned(resource: { version: number }, status = 200): Response {
  return HttpResponse.json(resource, {
    status,
    headers: { ETag: `"${String(resource.version)}"` },
  });
}

/** CRUD handlers shared by the three planner collections. */
function collectionHandlers<T extends { id: string; version: number }>(options: {
  path: string;
  name: string;
  items: () => T[];
  build: (input: Record<string, unknown>) => T;
}): HttpHandler[] {
  const { path, name, items, build } = options;
  const find = (id: unknown): T | undefined => items().find((item) => item.id === id);

  return [
    http.post(`${API}${path}`, async ({ request }) => {
      const rejected = rejectWrite(request);
      if (rejected) return rejected;

      const created = build(await jsonBody(request));
      items().push(created);
      return versioned(created, 201);
    }),

    http.patch(`${API}${path}/:id`, async ({ request, params }) => {
      const rejected = rejectWrite(request);
      if (rejected) return rejected;
      const current = find(params.id);
      if (!current) return notFound(name);
      const stale = rejectStale(request, current, name);
      if (stale) return stale;

      Object.assign(current, await jsonBody(request), { version: current.version + 1 });
      return versioned(current);
    }),

    http.delete(`${API}${path}/:id`, ({ request, params }) => {
      const rejected = rejectWrite(request);
      if (rejected) return rejected;
      const current = find(params.id);
      if (!current) return notFound(name);
      const stale = rejectStale(request, current, name);
      if (stale) return stale;

      items().splice(items().indexOf(current), 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

function overlapsRange(event: PlannerEvent, from: string, to: string): boolean {
  if (event.kind === 'timed') {
    return (event.startUtc ?? '') < to && (event.endUtc ?? '') > from;
  }
  // The fake user lives in UTC, where an instant's date is its ISO date.
  const lastDate = new Date(new Date(to).getTime() - 1).toISOString().slice(0, 10);
  return (event.startDate ?? '') <= lastDate && (event.endDate ?? '') > from.slice(0, 10);
}

const handlers: HttpHandler[] = [
  http.get(`${API}/health`, () => HttpResponse.json({ status: 'ok' })),

  http.get(`${API}/auth/session`, () =>
    HttpResponse.json(state.user ? sessionBody(state.user) : { user: null }),
  ),

  http.post(`${API}/auth/register`, async ({ request }) => {
    const { email, displayName } = await jsonBody(request);
    const user = openSession(buildUser({ email: String(email), displayName: String(displayName) }));
    return HttpResponse.json(sessionBody(user), { status: 201 });
  }),

  http.post(`${API}/auth/login`, () => {
    // Nobody is registered in a fresh fake; tests that need a user call signIn().
    return errorResponse(401, 'UNAUTHORIZED', 'Invalid email or password');
  }),

  http.post(`${API}/auth/demo`, () => {
    const user = openSession(buildUser({ displayName: 'Demo User', isDemo: true }));
    return HttpResponse.json(sessionBody(user), { status: 201 });
  }),

  http.post(`${API}/auth/logout`, ({ request }) => {
    const rejected = rejectWrite(request);
    if (rejected) return rejected;
    closeSession();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/calendars`, () =>
    state.user ? HttpResponse.json(state.calendars) : unauthorized(),
  ),
  http.get(`${API}/tasks`, () => (state.user ? HttpResponse.json(state.tasks) : unauthorized())),
  http.get(`${API}/events`, ({ request }) => {
    if (!state.user) return unauthorized();
    const query = new URL(request.url).searchParams;
    const from = query.get('from') ?? '';
    const to = query.get('to') ?? '';
    return HttpResponse.json(state.events.filter((event) => overlapsRange(event, from, to)));
  }),

  ...collectionHandlers({
    path: '/calendars',
    name: 'Calendar',
    items: () => state.calendars,
    build: (input) => buildCalendar(input),
  }),
  ...collectionHandlers({
    path: '/tasks',
    name: 'Task',
    items: () => state.tasks,
    build: (input) => buildTask(input),
  }),
  ...collectionHandlers({
    path: '/events',
    name: 'Event',
    items: () => state.events,
    build: (input) => buildTimedEvent(input),
  }),
];

export const fakeApi = {
  handlers,

  /** Back to an empty API with nobody signed in. Runs before every test. */
  reset(): void {
    closeSession();
    Object.assign(state, { calendars: [], tasks: [], events: [], nextId: 1 });
  },

  /** Starts the test with a session already open, as after a page reload. */
  signIn(user: AuthUser = buildUser()): AuthUser {
    return openSession(user);
  },

  /** Ends the session on the server only, as an expiry or a sign-out elsewhere would. */
  endSession(): void {
    state.user = null;
  },

  seed(data: { calendars?: Calendar[]; tasks?: Task[]; events?: PlannerEvent[] }): void {
    state.calendars.push(...(data.calendars ?? []));
    state.tasks.push(...(data.tasks ?? []));
    state.events.push(...(data.events ?? []));
  },

  /** Changes a task behind the app's back, as an edit from another tab would. */
  editTaskElsewhere(id: string, changes: Partial<Task>): void {
    const task = state.tasks.find((candidate) => candidate.id === id);
    if (!task) throw new Error(`No task ${id} in the fake API`);
    Object.assign(task, changes, { version: task.version + 1 });
  },

  /** Changes an event behind the app's back, as an edit from another tab would. */
  editEventElsewhere(id: string, changes: Partial<PlannerEvent>): void {
    const event = state.events.find((candidate) => candidate.id === id);
    if (!event) throw new Error(`No event ${id} in the fake API`);
    Object.assign(event, changes, { version: event.version + 1 });
  },

  /** What the API currently holds, for asserting on the outcome of a write. */
  get tasks(): readonly Task[] {
    return state.tasks;
  },

  get events(): readonly PlannerEvent[] {
    return state.events;
  },
};
