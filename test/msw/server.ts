import { setupServer } from 'msw/node';
import { fakeApi } from './fakeApi';

/** Intercepts every request the app makes during a test and answers from the fake API. */
export const server = setupServer(...fakeApi.handlers);
