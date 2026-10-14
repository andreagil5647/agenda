import { createTranslator, type Catalogue } from './translator';

const english = {
  plain: 'Plain text',
  greeting: 'Hello, {name}!',
  'tasks.open': { one: '{count} open task', other: '{count} open tasks' },
  'planned.for': 'Planned {title} for {time}.',
  'only.count': { one: 'One only', other: '{count} in all' },
} as const satisfies Catalogue;

type English = typeof english;

const t = createTranslator<English>(english, 'en');

describe('createTranslator', () => {
  it('returns plain text as it is', () => {
    expect(t('plain')).toBe('Plain text');
  });

  it('puts each value where its placeholder is', () => {
    expect(t('planned.for', { title: 'Write notes', time: '09:00' })).toBe(
      'Planned Write notes for 09:00.',
    );
  });

  it('uses a value in every place its placeholder appears', () => {
    const twice = createTranslator<{ readonly echo: 'Hey {who}, {who}!' }>(
      { echo: 'Hey {who}, {who}!' },
      'en',
    );

    expect(twice('echo', { who: 'you' })).toBe('Hey you, you!');
  });

  it('picks the singular form for one and the plural form for anything else', () => {
    expect(t('tasks.open', { count: 1 })).toBe('1 open task');
    expect(t('tasks.open', { count: 0 })).toBe('0 open tasks');
    expect(t('tasks.open', { count: 5 })).toBe('5 open tasks');
  });

  it('writes numbers the way the locale does', () => {
    const spanish = createTranslator<English>(english, 'es-ES');
    const german = createTranslator<English>(english, 'de-DE');

    expect(t('tasks.open', { count: 12345 })).toBe('12,345 open tasks');
    expect(german('tasks.open', { count: 12345 })).toBe('12.345 open tasks');
    // Spanish leaves four-digit numbers ungrouped.
    expect(spanish('tasks.open', { count: 1234 })).toBe('1234 open tasks');
  });

  it('chooses plural forms by the rules of the locale, not of English', () => {
    // In French zero is singular ("0 tâche"), which is not so in English.
    const french = createTranslator<English>(english, 'fr');

    expect(french('tasks.open', { count: 0 })).toBe('0 open task');
    expect(t('tasks.open', { count: 0 })).toBe('0 open tasks');
  });

  it('shows what is wrong when a placeholder gets no value at run time', () => {
    // Reflect.apply calls t without the compiler's checks, as untyped code could.
    const callUnchecked = (key: string, params: object): unknown =>
      Reflect.apply(t, undefined, [key, params]);

    expect(callUnchecked('greeting', {})).toBe('Hello, {name}!');
    expect(() => callUnchecked('tasks.open', {})).toThrow(/needs a numeric "count"/);
  });
});

/**
 * Never called: it exists to be type-checked. Each line must fail to compile, and
 * ts-expect-error fails the build if one of them starts to compile.
 */
function callsThatMustNotCompile(): void {
  // @ts-expect-error a message with a placeholder needs its values
  t('greeting');
  // @ts-expect-error the value is missing one of two placeholders
  t('planned.for', { title: 'x' });
  // @ts-expect-error a plural message needs its count
  t('tasks.open');
  // @ts-expect-error the count is a number
  t('tasks.open', { count: 'many' });
  // @ts-expect-error plain text takes no values
  t('plain', { name: 'x' });
  // @ts-expect-error there is no such message
  t('missing');
  // @ts-expect-error a plural message needs a count even if its text never shows it
  t('only.count', {});
}

describe('the types of t', () => {
  it('reject a call that the message cannot be built from', () => {
    expect(callsThatMustNotCompile).toBeInstanceOf(Function);
  });

  it('accept the calls that are right', () => {
    expect([
      t('plain'),
      t('greeting', { name: 'Ana' }),
      t('tasks.open', { count: 2 }),
      t('only.count', { count: 3 }),
    ]).toHaveLength(4);
  });
});
