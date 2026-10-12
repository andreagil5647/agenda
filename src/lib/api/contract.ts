/**
 * Names for the API's request and response shapes. Every type here is an
 * alias into schema.d.ts, which is generated from the backend's OpenAPI
 * document (`pnpm run api:generate`); none is written by hand.
 */
import type { components } from './schema';

type Schemas = components['schemas'];

export type ApiErrorBody = Schemas['ErrorResponse'];

export type AuthenticatedSession = Schemas['AuthenticatedSession'];
export type SessionResponse = Schemas['SessionResponse'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type LoginRequest = Schemas['LoginRequest'];

export type Calendar = Schemas['Calendar'];
export type CreateCalendarRequest = Schemas['CreateCalendarRequest'];

export type Task = Schemas['Task'];
export type CreateTaskRequest = Schemas['CreateTaskRequest'];

export type EventBlock = Schemas['Event'];
export type CreateTimedEventRequest = Extract<Schemas['CreateEventRequest'], { kind: 'timed' }>;
