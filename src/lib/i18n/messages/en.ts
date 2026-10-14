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

  // The sign-in screen
  'auth.hero.title': 'Give every task a time.',
  'auth.hero.lead':
    'Agenda puts your tasks and your events on one timeline, so the plan you make is a day you can actually keep.',
  'auth.points.drag': 'Drag a task onto the day to give it a time.',
  'auth.points.keyboard': 'Everything you can drag, you can also do with the keyboard.',
  'auth.points.safe': 'Changes show at once and are taken back if they cannot be saved.',
  'auth.demo.title': 'Just looking around?',
  'auth.demo.text': 'Open a ready-made day and try it. No sign-up, and nothing to set up.',
  'auth.demo.button': 'Try the demo',
  'auth.divider.logIn': 'or log in',
  'auth.divider.register': 'or create an account',
  'auth.logIn': 'Log in',
  'auth.register.heading': 'Create your account',
  'auth.register.submit': 'Create account',
  'auth.register.switch': 'Create an account',
  'auth.field.name': 'Name',
  'auth.field.email': 'Email',
  'auth.field.password': 'Password',
  'auth.submit.working': 'Working...',
  'auth.switch.newHere': 'New here?',
  'auth.switch.haveAccount': 'Already have an account?',
  'auth.preview.day': 'Monday',
  'auth.preview.standUp': 'Stand-up',
  'auth.preview.checklist': 'Draft the launch checklist',
  'auth.preview.lunch': 'Lunch with Marta',
  'auth.preview.task': 'Write release notes',
} as const satisfies Catalogue;
