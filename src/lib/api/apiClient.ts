import { env } from '../env';
import type {
  ApiErrorBody,
  AuthenticatedSession,
  LoginRequest,
  RegisterRequest,
  SessionResponse,
} from './types';

type JsonBody = object;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly details?: Record<string, unknown>,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

async function parseJson(res: Response): Promise<unknown> {
  if (res.status === 204) {
    return undefined;
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined;
  }

  return res.json() as Promise<unknown>;
}

async function request<TResponse>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: JsonBody;
    csrfToken?: string;
  } = {},
): Promise<TResponse> {
  const headers: Record<string, string> = {};
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.csrfToken) {
    headers['X-CSRF-Token'] = options.csrfToken;
  }

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const data = await parseJson(res);

  if (!res.ok) {
    if (isApiErrorBody(data)) {
      throw new ApiError(res.status, data.message, data.code, data.details, data.requestId);
    }

    throw new ApiError(res.status, 'The request could not be completed');
  }

  return data as TResponse;
}

export const apiClient = {
  getSession: () => request<SessionResponse>('/auth/session'),
  register: (body: RegisterRequest) =>
    request<AuthenticatedSession>('/auth/register', { method: 'POST', body }),
  login: (body: LoginRequest) =>
    request<AuthenticatedSession>('/auth/login', { method: 'POST', body }),
  logout: (csrfToken: string) => request<undefined>('/auth/logout', { method: 'POST', csrfToken }),
};
