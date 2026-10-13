# 0006. CSS Modules on design tokens, themes with `light-dark()`

- Status: Accepted
- Date: 2026-10-12

## Context

All styles lived in one template string injected by `App.tsx`: global class names, hard-coded
colours repeated across rules, and no way to add a dark theme without a second copy of every
colour. The time grid will add many small components that each need their own styles, and the
build is a hand-written Webpack config, so whatever is chosen has to be wired in by hand.

## Options considered

- **CSS-in-JS** (styled-components, Emotion): styles next to components and dynamic by props,
  at the cost of a runtime, a larger bundle and a second syntax for CSS.
- **Utility classes** (Tailwind): fast to write, but the design decisions move into long class
  lists in the markup, and it brings its own compiler and configuration.
- **Sass**: variables and nesting, both of which plain CSS now has, plus another compiler.
- **CSS Modules on custom properties**: plain CSS files, class names scoped per file by
  `css-loader`, shared values as custom properties. Two loaders and one plugin.

## Decision

Plain CSS in three layers:

- `src/styles/tokens.css` defines every colour, space, radius and shadow as a custom property.
  Components never name a colour directly.
- `src/styles/global.css` holds the base layer: element defaults and one focus style.
- Each component has a `*.module.css` next to it, with locally scoped class names.

Each colour token is written once, as `light-dark(light, dark)`. Which side applies follows
`color-scheme` on the root element: the system preference by default, or a fixed scheme when
`data-theme` is set to `light` or `dark`.

In development `style-loader` injects styles so they hot-reload. In production
`mini-css-extract-plugin` writes a content-hashed file that caches apart from the JavaScript.

## Consequences

- A theme is one file. A dark theme needed no second set of rules and no JavaScript.
- No runtime cost, and nothing to learn beyond CSS.
- `light-dark()` needs a browser from 2024 or later (Chrome 123, Firefox 120, Safari 17.5).
  Older browsers would lose colours rather than fall back, which is acceptable here and would
  need a build step that expands it if that ever changes.
- State that CSS has to react to is expressed in the markup, with attributes such as
  `aria-selected` or `data-status`, since there are no props to interpolate.
- Class names are not type-checked: a typo in `styles.panle` is `undefined`, not a build error.
