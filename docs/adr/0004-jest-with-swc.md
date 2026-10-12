# 0004. Jest with SWC for tests, not the webpack compiler directly

- Status: Accepted
- Date: 2026-09-28

## Context

Component and hook tests need a DOM (jsdom) and a fast TypeScript/JSX transform. Vitest was
the ADR-favoured choice for the backend's sibling decision, but here webpack is the bundler
the whole config was hand-written around (ADR 0002 / the plan's stated goal of a real
Webpack 5 setup), and Vitest is built on Vite, not webpack - pulling it in would mean two
unrelated dev-time bundlers in one project for no shared benefit.

## Options considered

- **Vitest**: fast, native ESM/TS, but brings in Vite (and, transitively, rolldown) purely
  for tests, alongside webpack for the app. The backend repo already ran into rolldown's
  native bindings being dropped from `package-lock.json` by incremental `npm install` on
  this machine (its own `docs/debugging/0001-...md`); adding the same dependency chain here
  for no reason the app needs would just invite that failure mode twice.
- **Jest + babel-jest**: works, but adds Babel as a second compiler alongside the SWC
  already used for the webpack build.
- **Jest + @swc/jest**: one compiler (SWC) for both the app bundle and the test run.

## Decision

Jest 30 with `@swc/jest`. The transform options are _not_ read from the shared `.swcrc`
verbatim: `.swcrc` targets ES modules (`module.type: "es6"`), which is what webpack needs
for tree-shaking, while Jest runs under CommonJS. `jest.config.js` passes its own SWC
options with `module.type: "commonjs"` and otherwise the same parser/target/React settings
as `.swcrc`, with a comment explaining the one deliberate difference.

`jest.config.js` is plain ESM JavaScript, not TypeScript: Jest's own config loader
hard-requires `ts-node` for a `.ts` config file (unlike webpack-cli, which tries several
loaders - see ADR 0002), and installing `ts-node` for one config object was not worth a
second TypeScript pipeline.

## Consequences

- Both the app and its tests are compiled by SWC, with one explained divergence
  (module target) rather than a fully shared config file.
- Jest's config is JS instead of TS, which is a smaller inconsistency than the alternative
  (a second compiler, or `ts-node` installed for one file).
