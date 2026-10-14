import { en } from '../i18n/messages/en';
import { es } from '../i18n/messages/es';
import { createTranslator } from '../i18n/translator';
import type { AppMessages } from '../i18n/catalogues';
import { ApiError, type ApiErrorCode } from './ApiError';
import { describeError } from './errorMessages';

const english = createTranslator<AppMessages>(en, 'en');
const spanish = createTranslator<AppMessages>(es, 'es');

const API_SENTENCE = 'The API said so';

function failure(code: ApiErrorCode, reason?: string): ApiError {
  return new ApiError({
    status: 400,
    code,
    message: API_SENTENCE,
    ...(reason ? { details: { reason } } : {}),
  });
}

describe('describeError', () => {
  it('writes the failures the app knows in the language it is given', () => {
    expect(describeError(failure('NETWORK_ERROR'), english)).toMatch(/Could not reach the server/);
    expect(describeError(failure('NETWORK_ERROR'), spanish)).toMatch(/No se pudo conectar/);
    expect(describeError(failure('PRECONDITION_FAILED'), spanish)).toMatch(/otro sitio/);
  });

  it('uses the same wording for the failures that mean "our fault"', () => {
    const ours: ApiErrorCode[] = [
      'UNEXPECTED_RESPONSE',
      'INTERNAL_ERROR',
      'PRECONDITION_REQUIRED',
      'BAD_REQUEST',
      'CONFLICT',
    ];

    for (const code of ours) {
      expect(describeError(failure(code), english)).toBe(en['error.generic']);
    }
  });

  it('says something useful about a thing that is not an API error at all', () => {
    expect(describeError(new TypeError('x'), english)).toBe(en['error.generic']);
    expect(describeError('boom', spanish)).toBe(es['error.generic']);
  });

  it('never shows the sentence the API wrote, which is English and meant for logs', () => {
    const codes: ApiErrorCode[] = ['BAD_REQUEST', 'CONFLICT', 'RATE_LIMITED', 'VALIDATION_ERROR'];

    for (const code of codes) {
      expect(describeError(failure(code), spanish)).not.toContain(API_SENTENCE);
    }
  });

  it('explains a failure by its reason where the code alone is too coarse', () => {
    expect(describeError(failure('CONFLICT', 'email_taken'), english)).toBe(
      en['error.reason.email_taken'],
    );
    expect(describeError(failure('CONFLICT', 'email_taken'), spanish)).toBe(
      'Ese correo ya está registrado. Prueba a iniciar sesión.',
    );
    expect(describeError(failure('RATE_LIMITED', 'demo_full'), spanish)).toBe(
      es['error.reason.demo_full'],
    );
    expect(describeError(failure('BAD_REQUEST', 'end_not_after_start'), spanish)).toBe(
      es['error.reason.end_not_after_start'],
    );
  });

  it('tells a full demo from being sent too many requests', () => {
    expect(describeError(failure('RATE_LIMITED'), english)).toBe(en['error.RATE_LIMITED']);
    expect(describeError(failure('RATE_LIMITED', 'demo_full'), english)).toBe(
      en['error.reason.demo_full'],
    );
  });

  it('falls back to the wording of the code for a reason it has not heard of', () => {
    expect(describeError(failure('RATE_LIMITED', 'from_the_future'), english)).toBe(
      en['error.RATE_LIMITED'],
    );
  });

  it('lets a screen word a failure its own way', () => {
    const unauthorized = failure('UNAUTHORIZED');

    expect(describeError(unauthorized, english)).toBe(en['error.UNAUTHORIZED']);
    expect(describeError(unauthorized, english, { UNAUTHORIZED: 'auth.invalidCredentials' })).toBe(
      en['auth.invalidCredentials'],
    );
  });
});
