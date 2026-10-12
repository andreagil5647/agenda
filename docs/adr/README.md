# Architecture decision records

Short records of decisions that shape the web app, written when the decision is made.
A superseded record stays in place with a link to the one that replaces it.

| #    | Decision                                                                                                  | Status   |
| ---- | --------------------------------------------------------------------------------------------------------- | -------- |
| 0001 | [Same toolchain conventions as the backend](0001-toolchain.md)                                            | Accepted |
| 0002 | [Webpack config files run under Node's native TypeScript stripping](0002-native-ts-for-webpack-config.md) | Accepted |
| 0003 | [Same-origin API through the static site's rewrite](0003-same-origin-api-through-render-rewrite.md)       | Accepted |
| 0004 | [Jest with SWC for tests, not the webpack compiler directly](0004-jest-with-swc.md)                       | Accepted |
| 0005 | [pnpm for frontend package management](0005-pnpm-package-manager.md)                                      | Accepted |
| 0006 | [CSS Modules on design tokens, themes with `light-dark()`](0006-css-modules-and-design-tokens.md)         | Accepted |
| 0007 | [TanStack Query for server state](0007-tanstack-query-for-server-state.md)                                | Accepted |

New records copy [the template](template.md).
