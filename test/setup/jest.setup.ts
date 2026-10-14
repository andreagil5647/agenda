import '@testing-library/jest-dom';
import { resetDevice } from '../helpers/device';
import { fakeApi } from '../msw/fakeApi';
import { server } from '../msw/server';

// A request no handler knows about is a bug in the test or in the app, so it
// fails loudly instead of reaching for a real network.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  fakeApi.reset();
  resetDevice();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
