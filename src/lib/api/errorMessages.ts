import { ApiError, type ApiErrorCode } from './ApiError';

const FALLBACK = 'Something went wrong on our side. Try again in a moment.';

/**
 * What to tell the user for each kind of failure. Codes mapped to `null` show
 * the API's own message, which for those is already written for people
 * ("Event end must be after start", "Email is already registered").
 */
const MESSAGES: Record<ApiErrorCode, string | null> = {
  NETWORK_ERROR: 'Could not reach the server. Check your connection and try again.',
  UNEXPECTED_RESPONSE: FALLBACK,
  INTERNAL_ERROR: FALLBACK,
  UNAUTHORIZED: 'Your session has ended. Log in again to continue.',
  FORBIDDEN: 'That request was refused. Reload the page and try again.',
  NOT_FOUND: 'That item no longer exists. It may have been deleted somewhere else.',
  PRECONDITION_FAILED:
    'This was changed somewhere else in the meantime. The latest version is shown now; try again.',
  PRECONDITION_REQUIRED: FALLBACK,
  VALIDATION_ERROR: 'Some of that was not valid. Check the fields and try again.',
  PAYLOAD_TOO_LARGE: 'That is too much to save at once.',
  BAD_REQUEST: null,
  CONFLICT: null,
  RATE_LIMITED: null,
};

/**
 * Turns any thrown value into a sentence for the user. A screen can override
 * the wording of a code where it means something more specific there.
 */
export function describeError(
  error: unknown,
  overrides: Partial<Record<ApiErrorCode, string>> = {},
): string {
  if (!(error instanceof ApiError)) {
    return FALLBACK;
  }
  return overrides[error.code] ?? MESSAGES[error.code] ?? error.message;
}
