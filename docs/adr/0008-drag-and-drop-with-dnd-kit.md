# 0008. Drag and drop with dnd-kit, and explicit controls for the keyboard

- Status: Accepted
- Date: 2026-10-12

## Context

Planning a day means giving tasks a time: a task is dragged from the list onto the hour grid
and becomes a block as long as its estimate, and blocks are then moved and resized. The grid
scrolls, positions snap to 15 minutes, and the drop has to be shown before it happens so the
user can see what time they are about to pick.

Every one of these has to be possible without a pointer as well.

## Options considered

- **The HTML drag and drop API**: built in, but it gives no control over the drag image, fires
  no events on touch screens, and reports positions too coarsely to snap a preview while
  dragging.
- **Hand-written pointer events** for everything: no dependency and full control. It also means
  writing drag activation thresholds, a layer that follows the pointer above everything else,
  drop target measurement and auto-scrolling of the grid near its edges. Each is small; together
  they are a drag library.
- **react-dnd**: mature, but built around the HTML API by default, with touch support in a
  separate backend.
- **dnd-kit**: pointer-based sensors that work for mouse, pen and touch, a drag overlay,
  measured drop targets and auto-scrolling. It reports live positions, so snapping is ours to do.

## Decision

Use `@dnd-kit/core` for picking something up and dropping it on the grid.

- The arithmetic stays out of the library. dnd-kit reports where the dragged element is; pure
  functions in `features/timeline/dayLayout.ts` turn that into a time span, snapped and kept
  inside the day. They are unit-tested without a DOM.
- The grid is the drop target and knows which time of day a screen position is, taking its own
  scroll offset into account. While something is dragged over it, the grid draws where it would
  land. That is recomputed when the grid scrolls as well as when the pointer moves, because the
  grid scrolls by itself while something is held near its edge.
- Dragging is a pointer shortcut, not the only way. dnd-kit's keyboard sensor moves an element
  by pixels, which maps badly onto "the next free half hour" on a grid that scrolls. Instead
  each drag has a control of its own: a task has a **Plan** button that places it at the next
  free time, and a block is moved and resized with the arrow keys. The drag handles are hidden
  from assistive technology, since they offer nothing those controls do not.
- Changing a block's length is not a pick-up-and-drop. It is done with pointer events on the
  block's edge.

## Consequences

- Mouse, pen and touch dragging behave the same, with one preview mechanism.
- Results of planning are announced in a live region, so they are not silent for someone who
  cannot see the block appear.
- About 14 kB gzipped is added to the bundle.
- A real drag cannot be simulated in jsdom, which lays nothing out. Component tests cover the
  keyboard paths and the arithmetic; the pointer paths are checked in a browser and are the
  first candidates for end-to-end tests.
