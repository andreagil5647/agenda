import type { ApiErrorBody } from './contract';

/** The codes the API sends, plus two for failures that never produced an error body. */
export type ApiErrorCode = ApiErrorBody['code'] | 'NETWORK_ERROR' | 'UNEXPECTED_RESPONSE';

interface ApiErrorFields {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

/** Every failed request surfaces as this one error type, whatever went wrong. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;

  constructor({ status, code, message, details, requestId }: ApiErrorFields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (details) this.details = details;
    if (requestId) this.requestId = requestId;
  }
}

// The shape is checked; the set of codes is trusted to be the one in the
// contract, the same way response bodies are.
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

/** Builds the error for a response the API answered with a failure status. */
export function toApiError(status: number, body: unknown): ApiError {
  if (isApiErrorBody(body)) {
    return new ApiError({ status, ...body });
  }
  return new ApiError({
    status,
    code: 'UNEXPECTED_RESPONSE',
    message: `The server answered ${String(status)} without an error description`,
  });
}

/** Whether the resource changed on the server since the version the change was based on. */
export function isStaleVersion(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'PRECONDITION_FAILED';
}
