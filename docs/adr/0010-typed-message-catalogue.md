# 0010. A typed message catalogue for translations

- Status: Accepted
- Date: 2026-10-13

## Context

The app is moving from English-only to English and Spanish, with a language switch that works
without a reload. All text was written inline in components: about a hundred strings across ten
files, plus screen-reader announcements and error messages built in code.

What matters most for translations here is not features but not shipping a hole: a Spanish
screen with one English label left in it, or a message whose `{count}` was dropped in
translation. The checks should happen when the code is built, not when a reader notices.

## Options considered

- **`react-i18next`**: the most widely used. Runtime lookup by string key, plurals and
  interpolation, namespaces, detection plugins. A missing or misspelt key is a runtime miss, a
  wrong parameter is not caught, and it is 15 to 25 kB with its core library.
- **FormatJS / `react-intl`**: ICU message syntax, which handles gender and complex plurals, and
  a compiler for messages. Heavier (about 30 kB), and it needs a build step to be worth it.
- **Lingui**: compiles messages at build time, so the runtime is small. It adds a compiler
  macro and an extraction tool, which this hand-written toolchain would have to carry.
- **A typed catalogue of our own** (chosen): messages are a plain object, and the types read
  each message to learn what it needs.

## Decision

`src/lib/i18n` holds a small translator and one catalogue file per language.

- `messages/en.ts` is the source. `messages/es.ts` is typed as a `Translation` of it, so the
  compiler rejects a Spanish file with a missing key, an extra one, or a plural message written
  as plain text.
- `t(key, params)` is typed from the message: a message with `{name}` requires `name`, a message
  with a plural form requires a numeric `count`, plain text takes nothing, and an unknown key
  does not compile. The type tests in `translator.test.ts` use `@ts-expect-error` to keep this
  true.
- A unit test checks what types cannot see: that each translation uses the same placeholders as
  English, is not empty, and is not left identical to the English text.
- Numbers are written with `Intl.NumberFormat` and plural forms chosen with `Intl.PluralRules`,
  both for the language's locale. Only "one" and "other" forms exist.
- English is in the main bundle, so the app can always start. Every other language is its own
  chunk, loaded the first time it is used. Until it has arrived the screen stays as it is, so
  there is never a mixture, and if it cannot be loaded the language does not change.
- The language is the saved choice, otherwise the browser's first supported language, otherwise
  English. The choice is saved on the device, validated when read.
- A lint rule bans literal text in components, so a new string cannot skip the catalogue.

## Consequences

- Adding a language is one file that the compiler checks against English, plus its name in
  `languages.ts`.
- No dependency, and the runtime is a single small module.
- Messages cannot contain literal braces, and there are no ICU features: no gender, no "few" or
  "many" plural forms, no rich text inside a message. Two languages with whole-number plurals
  do not need them.
- Translators have to work in the repository. The catalogue is TypeScript, not a format a
  translation service reads.
- Revisit when any of these happens: a third language with plural forms beyond "one" and
  "other", translation done by someone outside the repository, or messages that need markup
  inside them. At that point Lingui or FormatJS is the better tool, and the catalogue is easy
  to convert because messages are already keyed text with named placeholders.
