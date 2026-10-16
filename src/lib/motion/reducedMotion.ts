/**
 * Whether the reader asked for less motion. CSS honours this by itself; this is for the places
 * where JavaScript starts or keeps something that only exists to move, and should not do either.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
