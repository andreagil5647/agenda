import type { Catalogue } from '../translator';

/**
 * Every piece of text the app shows or announces, in English. This file is the
 * source: the other languages are checked against its keys and placeholders.
 * Text the user wrote (task titles, calendar names) never goes through here.
 */
export const en = {
  'brand.name': 'Agenda',

  // Screens shown while the app is not ready to be used
  'app.loading.title': 'Getting your planner ready.',
  'app.session.title': 'Welcome back.',
  'app.session.loading': 'Loading your session...',
  'app.status.checking': 'Checking the API...',
  'app.status.ready': 'API is up.',
  'app.status.waking':
    'Waking up the server. Free hosting sleeps when idle; this usually takes under a minute.',
  'app.status.error': 'Could not reach the API. Try reloading in a moment.',
  'app.status.elapsed': '{message} ({seconds}s)',

  // The frame around every signed-in screen
  'shell.skipLink': 'Skip to the planner',
  'shell.account': 'Account',
  'shell.demoNote': 'Demo account. It is deleted after a day.',
  'shell.logOut': 'Log out',
  'shell.version': 'web {version}',

  // How reads, writes and notices behave everywhere
  'query.retry': 'Try again',
  'query.stale': 'This could not be refreshed and may be out of date.',
  'notice.dismiss': 'Dismiss',

  // What to tell the user when a request fails
  'error.generic': 'Something went wrong on our side. Try again in a moment.',
  'error.NETWORK_ERROR': 'Could not reach the server. Check your connection and try again.',
  'error.UNAUTHORIZED': 'Your session has ended. Log in again to continue.',
  'error.FORBIDDEN': 'That request was refused. Reload the page and try again.',
  'error.NOT_FOUND': 'That item no longer exists. It may have been deleted somewhere else.',
  'error.PRECONDITION_FAILED':
    'This was changed somewhere else in the meantime. The latest version is shown now; try again.',
  'error.VALIDATION_ERROR': 'Some of that was not valid. Check the fields and try again.',
  'error.PAYLOAD_TOO_LARGE': 'That is too much to save at once.',
  'auth.invalidCredentials': 'That email and password do not match.',
} as const satisfies Catalogue;
