/**
 * Names for the API's request and response shapes. Every type here is an
 * alias into schema.d.ts, which is generated from the backend's OpenAPI
 * document (`pnpm run api:generate`); none is written by hand.
 */
import type { components } from './schema';

type Schemas = components['schemas'];

export type ApiErrorBody = Schemas['ErrorResponse'];
/** Why a request failed, where its code alone is too coarse to say. */
export type ErrorReason = NonNullable<NonNullable<ApiErrorBody['details']>['reason']>;

export type AuthUser = Schemas['AuthUser'];
export type AuthenticatedSession = Schemas['AuthenticatedSession'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type LoginRequest = Schemas['LoginRequest'];

export type Calendar = Schemas['Calendar'];
export type CreateCalendarRequest = Schemas['CreateCalendarRequest'];

export type Task = Schemas['Task'];
export type CreateTaskRequest = Schemas['CreateTaskRequest'];
export type PatchTaskRequest = Schemas['PatchTaskRequest'];

/** A timed or all-day entry on the timeline. Named apart from the DOM's `Event`. */
export type PlannerEvent = Schemas['Event'];
export type CreateEventRequest = Schemas['CreateEventRequest'];
export type PatchEventRequest = Schemas['PatchEventRequest'];
