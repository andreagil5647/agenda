/** How long the new theme takes to spread over the old one. */
const REVEAL_MS = 450;

/**
 * Makes `change`, which must put the new look on the page before it returns,
 * and shows it spreading in a circle from the middle of `origin`. A browser
 * without view transitions, or a reader who asked for less motion, gets the
 * change at once: the circle is an extra, never what makes the theme change.
 */
export function revealFrom(origin: Element, change: () => void): void {
  const wantsLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (wantsLessMotion || !('startViewTransition' in document)) {
    change();
    return;
  }

  const box = origin.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  // Far enough to cover the page from the farthest corner.
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(change);
  transition.ready.then(
    () => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: REVEAL_MS, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' },
      );
    },
    // A transition the browser skipped, such as one in a hidden tab, has nothing to reveal.
    () => undefined,
  );
}
