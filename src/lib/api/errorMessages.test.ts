import { en } from '../i18n/messages/en';
import { es } from '../i18n/messages/es';
import { createTranslator } from '../i18n/translator';
import type { AppMessages } from '../i18n/catalogues';
import { ApiError, type ApiErrorCode } from './ApiError';
import { describeError } from './errorMessages';

const english = createTranslator<AppMessages>(en, 'en');
const spanish = createTranslator<AppMessages>(es, 'es');

function failure(code: ApiErrorCode, message = 'The API said so'): ApiError {
  return new ApiError({ status: 400, code, message });
}

describe('describeError', () => {
  it('writes the failures the app knows in the language it is given', () => {
    expect(describeError(failure('NETWORK_ERROR'), english)).toMatch(/Could not reach the server/);
    expect(describeError(failure('NETWORK_ERROR'), spanish)).toMatch(/No se pudo conectar/);
    expect(describeError(failure('PRECONDITION_FAILED'), spanish)).toMatch(/otro sitio/);
  });

  it('uses the same wording for the failures that mean "our fault"', () => {
    const ours: ApiErrorCode[] = ['UNEXPECTED_RESPONSE', 'INTERNAL_ERROR', 'PRECONDITION_REQUIRED'];

    for (const code of ours) {
      expect(describeError(failure(code), english)).toBe(en['error.generic']);
    }
  });

  it('says something useful about a thing that is not an API error at all', () => {
    expect(describeError(new TypeError('x'), english)).toBe(en['error.generic']);
    expect(describeError('boom', spanish)).toBe(es['error.generic']);
  });

  it("shows the API's own sentence for the failures it explains itself", () => {
    for (const code of ['BAD_REQUEST', 'CONFLICT', 'RATE_LIMITED'] as const) {
      expect(describeError(failure(code, 'Email is already registered'), spanish)).toBe(
        'Email is already registered',
      );
    }
  });

  it('lets a screen word a failure its own way', () => {
    const unauthorized = failure('UNAUTHORIZED');

    expect(describeError(unauthorized, english)).toBe(en['error.UNAUTHORIZED']);
    expect(describeError(unauthorized, english, { UNAUTHORIZED: 'auth.invalidCredentials' })).toBe(
      en['auth.invalidCredentials'],
    );
  });
});
