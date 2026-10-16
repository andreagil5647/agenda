# 0012. Motion in CSS and browser APIs, under rules every theme keeps

- Status: Accepted
- Date: 2026-10-14

## Context

The planner is going to move a little: a task you finish, a block you drop, a day you change. That
feedback is only worth having if it never costs anything: it must not slow the app down, hold up the
next action, get in the way of someone who asked for less motion, or look different in a way that
makes one theme harder to use than another. It also has to feel like each theme: crisp and stepped
for Arcade, slow and soft for Seaside.

## Options considered

- **An animation library** (the `motion` family, `react-spring`): declarative layout and exit
  animations, and physics, in exchange for a dependency that grows with the parts used, a second
  way to describe animation next to CSS, and its own reduced-motion handling to keep in step with
  the CSS rule.
- **CSS transitions and keyframes, the Web Animations API and view transitions** (chosen): nothing
  to ship, the compositor does the work for `transform` and `opacity`, and the reduced-motion rule
  already in `global.css` covers everything written in CSS.

## Decision

No animation library to start. Motion is written in CSS where it can be, and with the Web
Animations API or view transitions where CSS cannot reach (the theme reveal is the first). The
rules:

1. **Motion answers something the reader just did.** Nothing moves on its own to get attention. A
   finished task that is already in the list when it loads does not celebrate, and neither does one
   that another device finished. A transition does not run on first render, so a state that is
   simply there stays still. Anything that has to know "the reader did this" says so explicitly
   (`useCelebration`), and ends when the change is taken back.
2. **Feedback lasts 300 ms or less and never blocks the next action.** `--motion-feedback` is the
   duration of feedback, set per theme and never above 300 ms. Nothing is disabled or made
   unclickable while it plays.
3. **Layout never animates.** Things that move use `transform` and `opacity`, which the compositor
   handles without layout or paint. A colour change on a small control is fine; widths, heights and
   positions are not animated.
4. **Reduced motion means no motion, not less.** The global rule in `global.css` ends every CSS
   animation and transition at once, so the end state is what is seen. Decorative effects that are
   only motion, such as the burst, are not shown at all. Animation driven from JavaScript checks the
   same media query before it starts.
5. **A theme sets the flavour through tokens.** `--motion-fast`, `--motion-feedback`, `--motion-ease`
   and the burst tokens (size, distance, shape, colours) differ per theme; components never name a
   theme. A theme may change how motion feels, never whether the interface is usable.
6. **Performance is checked, not assumed.** The phase ends with a trace under CPU throttling,
   before and after, and input delay must not get worse.

First use, finishing a task:

- The tick draws itself from its short stroke to its long one, as a `transform` transition on the
  box's tick. It runs when the checked state changes and only then.
- A burst of six marks flies out of the box: stars for Paper and Midnight, pixel coins for Arcade,
  petals for Seaside. It is six elements and one keyframe animation, with no JavaScript driving it,
  and takes itself away when it ends.
- The strike-through is left as it was. A line drawn across wrapped text cannot be done with
  `transform` alone, and fading its colour would show a line on every open task in forced-colours
  mode, where the browser overrides the decoration colour.

## Consequences

- No new dependency, and nothing in the entry bundle beyond a few hundred bytes of CSS per effect.
- Layout and exit animations are awkward by hand: a block that shrinks away when it is deleted has
  to stay in the document until its animation ends. When that becomes more code than it is worth,
  adopt the `motion` library for those cases only, with an ADR that says what it cost.
- JavaScript-driven animation needs the reduced-motion check in one place. The theme reveal has its
  own for now; a second consumer is the moment to share it.
- Each effect has to be seen to be believed: jsdom cannot play an animation, so tests cover what
  decides whether one plays (only for the reader's own action, taken back with the change), and the
  look is checked in a browser in every theme.
