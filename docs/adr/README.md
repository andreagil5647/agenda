# Architecture decision records

Short records of decisions that shape the web app, written when the decision is made.
A superseded record stays in place with a link to the one that replaces it.

| #    | Decision                                                                                                  | Status                               |
| ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 0001 | [Same toolchain conventions as the backend](0001-toolchain.md)                                            | Accepted                             |
| 0002 | [Webpack config files run under Node's native TypeScript stripping](0002-native-ts-for-webpack-config.md) | Accepted                             |
| 0003 | [Same-origin API through the static site's rewrite](0003-same-origin-api-through-render-rewrite.md)       | Accepted                             |
| 0004 | [Jest with SWC for tests, not the webpack compiler directly](0004-jest-with-swc.md)                       | Accepted                             |
| 0005 | [pnpm for frontend package management](0005-pnpm-package-manager.md)                                      | Accepted                             |
| 0006 | [CSS Modules on design tokens, themes with `light-dark()`](0006-css-modules-and-design-tokens.md)         | Accepted, in part superseded by 0011 |
| 0007 | [TanStack Query for server state](0007-tanstack-query-for-server-state.md)                                | Accepted                             |
| 0008 | [Drag and drop with dnd-kit, and explicit controls for the keyboard](0008-drag-and-drop-with-dnd-kit.md)  | Accepted                             |
| 0009 | [A paper planner look, with self-hosted fonts and checked contrast](0009-visual-identity.md)              | Accepted                             |
| 0010 | [A typed message catalogue for translations](0010-typed-message-catalogue.md)                             | Accepted                             |
| 0011 | [Named themes, each one a stylesheet of tokens](0011-named-themes-as-token-sheets.md)                     | Accepted                             |
| 0012 | [Motion in CSS and browser APIs, under rules every theme keeps](0012-motion-with-css-and-browser-apis.md) | Accepted                             |

New records copy [the template](template.md).
