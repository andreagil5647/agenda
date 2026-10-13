# 0009. A paper planner look, with self-hosted fonts and checked contrast

- Status: Accepted
- Date: 2026-10-13

## Context

The first version of the interface used the defaults most web apps share: a blue accent, a
system sans-serif, white cards floating on a grey page with large blurred shadows, and small
upper-case blue labels over every heading. It worked, and it looked like every other app.

The product is a planner, which is a physical thing people already know: paper, ink, coloured
pens, stickers. The look should be friendly, because planning a day is easier when the tool is
pleasant, and it should stay serious, because people put their work in it. It also has to meet the
accessibility bar the rest of the app is held to.

## Options considered

- **A component library** (MUI, Chakra, shadcn/ui): fast to build, but the result is the default
  look of that library, and it brings a large dependency for a handful of components.
- **Re-colouring the existing tokens**: cheap, but flat white cards and uniform blue stay the
  structure, so only the hue changes.
- **A custom identity on the existing token system** (chosen): the tokens already hold every
  colour, size and shadow, so a new identity is a change to tokens and component styles with no
  new runtime code.

For fonts:

- **System fonts only**: no cost, and no character.
- **Google Fonts from their servers**: easy, but every visit sends the visitor's address to a
  third party, which needs a consent decision under EU privacy rules, and it delays the first
  paint.
- **Self-hosted variable fonts** (chosen): `@fontsource-variable` packages, bundled by Webpack and
  served from the same origin.

## Decision

The look is a paper planner.

- **Colour.** Warm cream paper and a plum-black ink instead of white and grey. A pine green for
  what you press and what is selected. A coral reserved for the current time. Calendars get
  pastel fills with a darker ink for text and a mid tone for the edge: blue, green, purple, rose,
  peach and butter. The dark theme is the same planner at night, designed colour by colour, not
  inverted.
- **Shape.** Large rounded corners, pill buttons, and a solid "paper edge" under panels and
  buttons instead of blurred shadows. Buttons sit a little off the page and are pressed onto it.
  No gradients.
- **Type.** Nunito, a rounded sans-serif, for the interface. Fraunces, a soft serif, for the day,
  the headings and the brand. Together they read as warm and still serious.
- **Brand.** A calendar page with a small smile, drawn as inline SVG, which is also the favicon.
  A handful of stroke icons in the same style, with no icon library.
- **Behaviour.** The sign-in screen leads with a one-click demo. Empty lists say what to do next.
  There is a skip link, one visible focus style for everything, and one primary action per screen.
  Touch screens get 44 to 48 pixel targets and a taller hour on the grid, so a half-hour block can
  be hit. Motion is short and optional: with `prefers-reduced-motion` there is none.
- **Contrast is a test.** Every colour that carries text is written as a six-digit hex value in
  `light-dark()`, and `styles/tokens.test.ts` fails if a text pair drops below 4.5:1, or a
  control border, focus ring or the now line below 3:1, in either theme.

## Consequences

- A new colour or a changed shade cannot ship without passing the contrast test. The cost is that
  tokens have to stay hex values; a colour space such as `oklch` would need the test to learn it.
- The fonts add about 76 kB of woff2 to a first visit (the Latin subsets, fetched by
  `unicode-range`; extended Latin only if a page uses it), cached after that. Code and CSS grew by
  about 5 kB gzipped.
- The identity lives in `styles/tokens.css` and the component stylesheets. Changing it again is a
  change to those files, not to components.
- There is still no switch for the theme: it follows the system. `data-theme` on the root element
  already forces one, for the settings screen to use.
- A deliberately distinctive look is a matter of taste. The parts that are not, the contrast, the
  target sizes, the focus style and the reduced-motion rule, are the ones with tests or rules.
