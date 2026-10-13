import type { AppTranslate, PlainMessageKey } from '../i18n/catalogues';
import { ApiError, type ApiErrorCode } from './ApiError';

/**
 * What to tell the user for each kind of failure. A code mapped to `null`
 * shows the API's own message, which for those is already written for people
 * ("Event end must be after start", "Email is already registered").
 */
const MESSAGE_KEYS: Readonly<Record<ApiErrorCode, PlainMessageKey | null>> = {
  NETWORK_ERROR: 'error.NETWORK_ERROR',
  UNEXPECTED_RESPONSE: 'error.generic',
  INTERNAL_ERROR: 'error.generic',
  UNAUTHORIZED: 'error.UNAUTHORIZED',
  FORBIDDEN: 'error.FORBIDDEN',
  NOT_FOUND: 'error.NOT_FOUND',
  PRECONDITION_FAILED: 'error.PRECONDITION_FAILED',
  PRECONDITION_REQUIRED: 'error.generic',
  VALIDATION_ERROR: 'error.VALIDATION_ERROR',
  PAYLOAD_TOO_LARGE: 'error.PAYLOAD_TOO_LARGE',
  BAD_REQUEST: null,
  CONFLICT: null,
  RATE_LIMITED: null,
};

/** A screen can word a code differently where it means something more specific there. */
export type ErrorOverrides = Readonly<Partial<Record<ApiErrorCode, PlainMessageKey>>>;

/** Turns any thrown value into a sentence for the user, in the language of `t`. */
export function describeError(
  error: unknown,
  t: AppTranslate,
  overrides: ErrorOverrides = {},
): string {
  if (!(error instanceof ApiError)) {
    return t('error.generic');
  }

  const key = overrides[error.code] ?? MESSAGE_KEYS[error.code];
  return key ? t(key) : error.message;
}
