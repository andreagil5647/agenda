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
  'error.RATE_LIMITED': 'Too many attempts. Wait a moment and try again.',
  'error.reason.email_taken': 'That email is already registered. Try logging in instead.',
  'error.reason.demo_full': 'The demo is full right now. Try again in a few minutes.',
  'error.reason.end_not_after_start': 'The end has to be after the start.',
  'auth.invalidCredentials': 'That email and password do not match.',

  // The corner of the screen where preferences are changed
  'dock.label': 'Preferences',
  'language.label': 'Language',
  'language.loadFailed': 'Could not load that language. Check your connection and try again.',
  'theme.group': 'Theme',
  'theme.choose': 'Choose a theme',
  'theme.paper': 'Paper',
  'theme.midnight': 'Midnight',
  'theme.switch': 'Theme: {current}. Switch to {next}.',
  'theme.changed': 'Theme changed to {theme}.',

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

  // The day on screen
  'timeline.title': 'Timeline',
  'timeline.addBlock': 'Add block',
  'timeline.loading': 'Loading the day...',
  'timeline.needCalendar': 'Add a calendar first: every block belongs to one.',
  'timeline.empty.title': 'A clear day',
  'timeline.empty.hint':
    'Nothing is planned yet. Click the grid, press {addBlock}, or drag a task here.',
  'timeline.allDay': 'All day',
  'timeline.blocks': 'Blocks',
  'timeline.shortcuts':
    'Press the up or down arrow key to move the block by 15 minutes. Hold Shift with an arrow key to make it shorter or longer. Press Delete to remove it.',
  'timeline.date.today': 'Today',
  'timeline.date.previous': 'Previous day',
  'timeline.date.next': 'Next day',
  'timeline.date.goTo': 'Go to date',

  // The details of one block
  'block.new': 'New block',
  'block.details': 'Details',
  'block.close': 'Close',
  'block.title': 'Title',
  'block.calendar': 'Calendar',
  'block.start': 'Start',
  'block.end': 'End',
  'block.linkedTask': 'Time set aside for “{title}”.',
  'block.save': 'Save',
  'block.delete': 'Delete block',
  'block.endAfterStart': 'The end has to be after the start.',

  // Tasks
  'tasks.title': 'Tasks',
  'tasks.openCount': { one: '{count} open', other: '{count} open' },
  'tasks.new': 'New task',
  'tasks.dueDate': 'Due date',
  'tasks.estimate': 'Estimate in minutes',
  'tasks.add': 'Add task',
  'tasks.loading': 'Loading tasks...',
  'tasks.empty.title': 'No tasks yet',
  'tasks.empty.hint': 'Add the first one above, then give it a time on the day.',
  'tasks.item.drag': 'Drag onto the timeline',
  'tasks.item.planned': 'planned',
  'tasks.item.plan': 'Plan',
  'tasks.item.planLabel': 'Plan {title}',
  'tasks.item.deleteLabel': 'Delete {title}',

  // Calendars
  'calendars.title': 'Calendars',
  'calendars.new': 'New calendar',
  'calendars.color': 'Colour',
  'calendars.add': 'Add calendar',
  'calendars.loading': 'Loading calendars...',
  'calendars.empty.title': 'No calendars yet',
  'calendars.empty.hint': 'Every block lives in a calendar, so add one first.',
  'calendars.colors.blue': 'Blue',
  'calendars.colors.green': 'Green',
  'calendars.colors.purple': 'Purple',
  'calendars.colors.rose': 'Rose',

  // Read out for those who cannot see a block move
  'announce.planned': 'Planned {title} for {time}.',
  'announce.moved': 'Moved {title}: {time}.',
  'announce.resized': 'Resized {title}: {time}.',
  'announce.deleted': 'Deleted {title}.',
} as const satisfies Catalogue;
