# 0011. Named themes, each one a stylesheet of tokens

- Status: Accepted
- Date: 2026-10-14

## Context

Until now the app had one look in two versions: every colour was written once as
`light-dark(light, dark)` ([ADR 0006](0006-css-modules-and-design-tokens.md)) and the version
followed the device. The next step is several complete looks, some light and some dark, that a
person switches between with one button. A pair of values per token cannot hold four looks, and a
look is more than colour: a theme may also change fonts, corners, shadows and motion.

Three things have to stay true whatever the mechanism: the page must never flash in the wrong
theme on load, every theme must pass the same contrast checks, and components must not know which
theme is on.

## Options considered

- **Keep `light-dark()` and add a third and fourth value.** It does not exist: the function takes
  exactly two colours, so the idea stops at two looks.
- **Set the custom properties from JavaScript.** One object per theme, written to the root element
  at runtime. It works for any number of themes, but the page has no colours until the script runs,
  the colours live in TypeScript where the contrast test cannot read them as easily, and it pushes
  styling into inline style strings.
- **One stylesheet per theme, chosen by an attribute** (chosen). Each theme is a CSS file that
  defines every colour token under `[data-theme='<id>']`. The attribute on the root element selects
  it; nothing else changes.
- **One CSS file per theme, loaded on demand.** The same idea with a network request per switch. It
  is the right shape for fonts and textures once a theme has them, and not worth a request for a
  handful of colours.

## Decision

- `src/styles/tokens.css` keeps what no theme changes: type sizes, spacing, control sizes, radii,
  motion and the calendar colour mapping. A theme may override any of it if its look needs to.
- `src/styles/themes/<id>.css` defines every colour, and the shadow that contains one, for that
  theme, and its `color-scheme`. Each theme has exactly one scheme.
- Paper is also what the page wears with no attribute, through `:where(:root)`, which has no
  specificity, so any other theme wins whatever the order of the files.
- The selector is the attribute alone, not `:root[data-theme]`, so an element can carry a theme of
  its own. The theme button uses this to paint a small swatch of each theme from that theme's own
  tokens, with no colour written in a component.
- `src/lib/themes/themes.ts` is the one list of themes: id, scheme and the colour of the browser's
  bar. It drives the switch, the order, and the tests.
- The choice is saved on the device with the other preferences. A first visit gets Paper, or
  Midnight on a device set to dark.
- A short inline script in `index.html` sets the attribute before the first paint. It repeats the
  decision the app makes (`detectTheme`) because the app has not loaded yet. Tests run the script
  from the real `index.html` for every theme and for every combination of saved choice and device
  setting, and fail if it ever disagrees with the app.
- The new theme spreads in a circle from the button, with the View Transitions API. It is only an
  extra: a browser without it, or a reader who asked for less motion, gets an instant change.
- The switch is one button that goes to the next theme. A picker to choose directly is built when
  there are more than two themes to choose from.

## Consequences

- Adding a theme is one stylesheet, one line in the list and its name in the message catalogue.
  Tests fail if the stylesheet misses a token another theme has, if its scheme or bar colour
  disagree with the list, or if any colour pair drops below its contrast minimum.
- Components never mention a theme. A look that needs something tokens cannot express gets a new
  token in every theme, not a rule in a component.
- `light-dark()` is no longer used, so the app needs no browser from 2024 or later for colour.
- The page colour of a theme is written in three places: the stylesheet, the list and the inline
  script. They are held together by tests, not by one source. Generating the script from the list
  at build time would remove that, and was not worth a custom Webpack step for two values.
- The inline script would need a hash or a nonce if a strict content security policy is added. None
  is set today.
- If JavaScript is off, the page is Paper, whatever the device is set to.
