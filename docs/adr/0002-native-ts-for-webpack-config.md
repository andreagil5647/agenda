# 0002. Webpack config files run under Node's native TypeScript stripping

- Status: Accepted
- Date: 2026-09-28

## Context

The webpack config is written in TypeScript (`config/webpack/*.ts`) to type-check against
webpack's own `Configuration` type and catch mistakes before a build even starts. webpack-cli
loads a `.ts` config file through the `interpret` package, which tries several loaders in
turn (`ts-node/register`, `sucrase`, `@babel/register`, `esbuild-register`,
`@swc/register`), picking whichever is installed. None of these is otherwise needed: the
project already compiles TypeScript with SWC (`swc-loader` for the app, `@swc/jest` for
tests), and adding one of `interpret`'s loaders just to load four config files would be a
second, differently-configured TypeScript pipeline for no real benefit.

## Options considered

- **`ts-node`**: the most common choice, but a second CommonJS-oriented compiler alongside
  SWC, mainly justified here by convention rather than need.
- **`@swc/register`**: keeps SWC as the only compiler, but adds a require-hook package and
  its own transpile-on-require behaviour to reason about.
- **Compile the config to `.mjs` ahead of time**: an extra build step for four small files.
- **Write the config in plain `.js`** with JSDoc `@type` annotations: no loader needed, but
  loses real type-checking on the config (JSDoc types are checked more loosely).
- **Node's native `--experimental-strip-types`**: Node 22.14 (the pinned version) supports
  this behind a flag. It only erases type syntax, it does not down-level newer JS, which is
  fine here since the target is Node itself, not a browser.

## Decision

`package.json` invokes webpack-cli directly through Node with the flag:

```json
"_webpack": "node --experimental-strip-types --disable-warning=ExperimentalWarning node_modules/webpack-cli/bin/cli.js"
```

The flag applies to the whole process, including the dynamic `import()` webpack-cli uses
internally to load the `.ts` config, so no `interpret` loader is ever invoked.

One consequence of using Node's own ESM loader instead of a bundler-aware one: relative
imports between config files need an explicit extension (`from './paths.ts'`), which is
also why `tsconfig.json` sets `allowImportingTsExtensions: true`. Application code under
`src/`, which webpack itself compiles and resolves, keeps the conventional extension-less
imports (`from '../lib/env'`) - the two directories are loaded by two different module
loaders, so they follow that loader's own rules. `docs/debugging/0001-...md` covers how
this was found.

Jest could not use the same trick for its own `.ts` config file: it hard-requires
`ts-node`, unconditionally. That one file is plain ESM JavaScript with a JSDoc type
instead (see ADR 0004).

## Consequences

- No extra dependency is added just to load config files.
- `--experimental-strip-types` is still labelled experimental at this Node version; a
  warning is silenced with `--disable-warning`, but a future Node upgrade should confirm
  the flag (or its stabilised, unflagged form) still behaves the same way.
- Contributors need Node 22.6+ for the flag to exist at all; `.node-version` already pins
  a newer version than that.
