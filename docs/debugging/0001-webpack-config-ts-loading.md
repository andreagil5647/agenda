# 0001. webpack-cli could not load the .ts config: extension and plugin-shape errors

- Date found: 2026-09-28
- Area: tooling (webpack, ESLint)
- Fixed in: `build: hand-write the webpack 5 config`, `chore: add eslint and prettier`

## Symptom

Two unrelated failures while first wiring up the webpack config and ESLint, both from
misunderstanding how a package's flat-config or module shape actually looked, rather than
from a real bug in the app.

**A.** `npm run build` failed on every relative import inside `config/webpack/*.ts` and
inside `src/`:

```text
TS5097: An import path can only end with a '.ts' extension when
'allowImportingTsExtensions' is enabled.
```

**B.** Before that, `eslint.config.js` failed outright:

```text
A config object has a "plugins" key defined as an array of strings.
Flat config requires "plugins" to be an object
```

## Reproduction

A: write `import { paths } from './paths.ts'` in any two files under `config/webpack/`,
run `npm run build`.

B: `eslint.config.js` with `reactHooks.configs['recommended-latest']` in the config array,
run `npx eslint .`.

## Investigation

**A.** The webpack config files are loaded directly by Node
(`--experimental-strip-types`, see ADR 0002), which requires explicit extensions on
relative ESM imports and resolves `.ts` as written. `ForkTsCheckerWebpackPlugin`, however,
type-checks those same files against the project's `tsconfig.json`, and by default
TypeScript rejects a literal `.ts` extension in an import specifier. The error pointed at
the exact files where this mattered. Two different loaders (Node's own resolver, and
TypeScript's checker) needed to agree on the same files, and initially only one did.
Application code under `src/` does not have this problem: webpack resolves those imports
itself via `resolve.extensions`, so they were written without extensions from the start
and never triggered the error - the fix only touched files under `config/webpack/`.

**B.** `npx eslint .` failed before linting a single file. The message named
`eslint-plugin-react-hooks`'s config as the culprit, but the plugin's own README describes
`recommended-latest` as flat-config ready. Inspecting the package's actual exports (`node
-e "import('eslint-plugin-react-hooks').then(m => console.log(Object.keys(m.configs)))"`)
showed `configs` had both a `recommended-latest` key _and_ a `flat` key, and `flat` was
itself a namespace object containing its own `recommended` and `recommended-latest`
entries - the real flat config was nested one level deeper than the name suggested:
`configs.flat['recommended-latest']`, not `configs['recommended-latest']`.

## Root cause

**A.** `allowImportingTsExtensions` was not enabled, so a setting that only matters for
four config files broke type-checking project-wide until it was turned on.

**B.** Reading the plugin's top-level `configs` keys and assuming the shape from the name
(`recommended-latest`) matched its neighbour package's convention, instead of checking
what that specific version actually exported.

## Fix

**A.** `tsconfig.json` sets `"allowImportingTsExtensions": true` (already required
`noEmit: true`, which is the only other precondition). A comment next to it explains that
only `config/webpack/` needs this, so the extension-less style under `src/` is a choice,
not an oversight.

**B.** `eslint.config.js` uses `reactHooks.configs.flat['recommended-latest']`.

## Regression guard

Both are structural: `npm run build` and `npm run lint` fail immediately (not silently)
if either regresses, and both run in CI on every pull request.

## Takeaway

When a package's flat-config export doesn't work as documented, print its actual `configs`
object rather than guessing from the key name - `jsx-a11y` and `react-hooks`, two plugins
solving the same kind of problem, turned out to shape their exports differently.
