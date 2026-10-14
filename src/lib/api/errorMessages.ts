import type { AppTranslate, PlainMessageKey } from '../i18n/catalogues';
import { ApiError, type ApiErrorCode } from './ApiError';
import type { ErrorReason } from './contract';

/**
 * What to tell the user for each kind of failure. The API's own sentence is
 * English and written for logs, so no message on screen is taken from it.
 */
const CODE_MESSAGE_KEYS: Readonly<Record<ApiErrorCode, PlainMessageKey>> = {
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
  RATE_LIMITED: 'error.RATE_LIMITED',
  BAD_REQUEST: 'error.generic',
  CONFLICT: 'error.generic',
};

/**
 * What to tell the user where the reason says more than the code. Every reason
 * in the contract needs a line here, or the build fails.
 */
const REASON_MESSAGE_KEYS: Readonly<Record<ErrorReason, PlainMessageKey>> = {
  stale_version: 'error.PRECONDITION_FAILED',
  email_taken: 'error.reason.email_taken',
  demo_full: 'error.reason.demo_full',
  end_not_after_start: 'error.reason.end_not_after_start',
  fields_of_other_kind: 'error.generic',
};

// Looked up by text: a reason this version does not know falls back to its code.
const REASON_KEYS: ReadonlyMap<string, PlainMessageKey> = new Map(
  Object.entries(REASON_MESSAGE_KEYS),
);

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

  const reasonKey = error.reason === undefined ? undefined : REASON_KEYS.get(error.reason);
  return t(reasonKey ?? overrides[error.code] ?? CODE_MESSAGE_KEYS[error.code]);
}
