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

Second use, blocks on the grid:

- A block the reader drops or moves with the pointer lands with a small bounce; one made by a click
  or a button grows from its top edge, and picking one up lifts it. The arrow keys move a block
  without the bounce, since each press is a step and not a drop.
- A deleted block shrinks away. The block is gone from the grid at once, as before, and a picture
  of it, with no way to reach it and hidden from assistive technology, stays in the document until
  its animation ends. If the API refuses the delete and the block comes back, the picture goes.
- Which blocks move is decided by `useBlockMotion`, from the reader's actions only, so blocks that
  merely turn up (a day that loads, a change from elsewhere) never do. It keeps nothing for a
  reader who asked for less motion, so nothing waits for an animation that will not play.
- A new block has a provisional id until it is saved, and React takes a new id for a new element.
  A block now keeps the key it first had (`blockKey`), or the saved block would replace the one
  that is animating and cut it short.

Third use, the rest of the planner:

- The day slides in from the side the reader went towards, for a day they changed to and never
  the one shown on load. The open-task count rolls to its new number when the reader's own action
  moved it. The details of a block slide in when a block is first selected.
- Finishing the last open task is a bigger moment: a large burst, and a line of praise in a status
  region that is always on the page, so that it is read out when it appears.
- Which changes are the reader's is recorded as they are made. The open-task count first tried to
  tell from whether a write was pending, and that worked only on a slow network: with a fast API
  the write is over before anything is drawn, and the count changed in a render that saw nothing
  pending. A test through the whole app found it; the component rules alone had passed.
- Left out on purpose: the plan had the current-time line "breathe". That is motion on its own,
  with nobody having done anything, which the first rule rules out, so it is not built.

## Consequences

- No new dependency, and nothing in the entry bundle beyond a few hundred bytes of CSS per effect.
- Layout and exit animations are awkward by hand: a block that shrinks away when it is deleted has
  to stay in the document until its animation ends. Doing it for the blocks took one hook of about
  sixty lines, a small component and a stable key, which is not enough to justify a library. If a
  second kind of thing needs to leave, such as a task or a calendar, that is the time to look at
  the `motion` library again, with an ADR that says what it cost.
- JavaScript-driven animation checks the reduced-motion query through `prefersReducedMotion()`,
  which the theme reveal and the block motion share.
- What it costs was measured with `pnpm run perf:motion`: the same minute of planning, repeated,
  with the CPU slowed down six times, alternating runs with motion and with reduced motion, three
  of each. It runs against the development build, so the absolute times are far worse than what
  ships and mean little; the comparison is what counts. The worst input delay was about the same
  (836 ms with motion, 849 ms without, medians), as was the worst interaction (1520 ms and
  1952 ms). Long tasks were higher with motion (110 against 89), but the runs without motion
  ranged from 82 to 152, so that is inside the noise and not a finding either way. Nothing in
  this says motion is free, only that it does not show up above the variation in this setup.
  Running it against the production build is worth doing before a release.
- Each effect has to be seen to be believed: jsdom cannot play an animation, so tests cover what
  decides whether one plays (only for the reader's own action, taken back with the change), and the
  look is checked in a browser in every theme.
