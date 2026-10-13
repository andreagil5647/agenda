/**
 * Turns a message key into text. A catalogue is a plain object of messages;
 * the types read each message to learn what it needs, so a call that forgets a
 * value, or passes one the message does not use, does not compile.
 *
 *   'greeting': 'Hello, {name}!'                      t('greeting', { name })
 *   'tasks':    { one: '{count} task', other: '{count} tasks' }
 *                                                     t('tasks', { count })
 *
 * Anything in braces is a placeholder, so a message cannot contain literal braces.
 */

export interface Plural {
  readonly one: string;
  readonly other: string;
}

export type MessageValue = string | Plural;

export type Catalogue = Readonly<Record<string, MessageValue>>;

/** The names inside `{braces}` in a piece of text. */
type Placeholders<Text extends string> = Text extends `${string}{${infer Name}}${infer Rest}`
  ? Name | Placeholders<Rest>
  : never;

type TextsOf<Value extends MessageValue> = Value extends Plural
  ? Value['one'] | Value['other']
  : Value;

type PlaceholdersOf<Value extends MessageValue> = Placeholders<TextsOf<Value>>;

type Params<Value extends MessageValue> = Value extends Plural
  ? { readonly count: number } & Readonly<
      Record<Exclude<PlaceholdersOf<Value>, 'count'>, string | number>
    >
  : Readonly<Record<PlaceholdersOf<Value>, string | number>>;

/** The arguments after the key: none for plain text, the values for a message with placeholders. */
export type MessageArgs<Value extends MessageValue> = Value extends Plural
  ? [params: Params<Value>]
  : [PlaceholdersOf<Value>] extends [never]
    ? []
    : [params: Params<Value>];

export type Translate<Messages extends Catalogue> = <Key extends keyof Messages & string>(
  key: Key,
  ...args: MessageArgs<Messages[Key]>
) => string;

/** What a translation of `Source` has to contain: every key, with plurals staying plurals. */
export type Translation<Source extends Catalogue> = {
  readonly [Key in keyof Source]: Source[Key] extends string ? string : Plural;
};

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Builds the `t` function for one translation of `Source`. The types come from
 * the source catalogue (English), so every language is called the same way.
 *
 * Numbers are written the way `locale` writes them (1,500 or 1.500), and a
 * plural message picks its form with `Intl.PluralRules`. Only "one" and
 * "other" exist: that is all English and Spanish need for whole numbers, and
 * a language that needs more has to be added here first.
 */
export function createTranslator<Source extends Catalogue>(
  messages: Translation<Source>,
  locale: string,
): Translate<Source> {
  const numbers = new Intl.NumberFormat(locale);
  const plurals = new Intl.PluralRules(locale);

  return (key, ...args) => {
    const message: MessageValue = messages[key];
    const params: object = args[0] ?? {};
    const valueOf = (name: string): unknown => Reflect.get(params, name);

    let template: string;
    if (typeof message === 'string') {
      template = message;
    } else {
      const count = valueOf('count');
      if (typeof count !== 'number') {
        throw new TypeError(`The message "${key}" is plural and needs a numeric "count"`);
      }
      template = plurals.select(count) === 'one' ? message.one : message.other;
    }

    return template.replace(PLACEHOLDER, (placeholder, name: string) => {
      const value = valueOf(name);
      if (typeof value === 'number') return numbers.format(value);
      if (typeof value === 'string') return value;
      return placeholder;
    });
  };
}
