import createClient, { type Middleware } from 'openapi-fetch';
import { ApiError, toApiError } from './ApiError';
import type { paths } from './schema';

const CSRF_COOKIE_NAME = 'agenda_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const pair = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
  return pair ? decodeURIComponent(pair.slice(prefix.length)) : undefined;
}

/**
 * The API pairs the session cookie with a second, script-readable cookie and
 * expects its value back in a header on every write. Reading it here, at the
 * moment of the request, means no caller has to carry the token around.
 */
const csrfMiddleware: Middleware = {
  onRequest({ request }) {
    const token = SAFE_METHODS.has(request.method) ? undefined : readCookie(CSRF_COOKIE_NAME);
    if (token) {
      request.headers.set(CSRF_HEADER_NAME, token);
    }
    return request;
  },
};

/**
 * Typed by the API contract: paths, parameters, bodies and responses all come
 * from schema.d.ts. The API is always same-origin (the dev server and the
 * production host both forward /api/*), so the base is the page's own origin.
 */
export const api = createClient<paths>({
  baseUrl: window.location.origin,
  credentials: 'same-origin',
  // Resolved on each call instead of captured once, so anything that wraps the
  // global fetch after startup, such as the mock server in tests, sees every request.
  fetch: (request) => globalThis.fetch(request),
});
api.use(csrfMiddleware);

interface Outcome<TData> {
  data?: TData;
  error?: unknown;
  response: Response;
}

async function settle<TData>(request: Promise<Outcome<TData>>): Promise<Outcome<TData>> {
  try {
    return await request;
  } catch (error) {
    // A cancelled request is not a failure; let whoever cancelled it see that.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'The request did not reach the server',
    });
  }
}

/** Resolves with the response body, or throws an ApiError for any kind of failure. */
export async function unwrap<TData>(request: Promise<Outcome<TData>>): Promise<TData> {
  const { data, error, response } = await settle(request);
  if (!response.ok) {
    throw toApiError(response.status, error);
  }
  if (data === undefined) {
    throw new ApiError({
      status: response.status,
      code: 'UNEXPECTED_RESPONSE',
      message: 'The server answered without the expected content',
    });
  }
  return data;
}

/** Like `unwrap`, for requests that succeed without a body. */
export async function unwrapEmpty(request: Promise<Outcome<unknown>>): Promise<void> {
  const { error, response } = await settle(request);
  if (!response.ok) {
    throw toApiError(response.status, error);
  }
}

/**
 * The header that tells the API which version of a resource a change is based
 * on. If the resource has moved on since, the API refuses the change.
 */
export function ifMatch(resource: { version: number }): { 'If-Match': string } {
  return { 'If-Match': `"${String(resource.version)}"` };
}
