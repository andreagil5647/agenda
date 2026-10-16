import type { Locator, Page } from '@playwright/test';

/** What a keyframe carries besides the properties it animates. */
const KEYFRAME_BOOKKEEPING = new Set(['offset', 'easing', 'composite', 'computedOffset']);

/**
 * Makes feedback last long enough to look at: the length of every one is a token, so overriding
 * the token is enough. Together with `finishAnimations` it turns "was it there for a moment"
 * into "is it there now", which is something a test can ask.
 */
export async function slowMotion(page: Page): Promise<void> {
  await page.addStyleTag({ content: ':root { --motion-feedback: 20s !important; }' });
}

/** Lets everything that is animating arrive at its end, as if the time had passed. */
export async function finishAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.finish();
  });
}

/** The properties the keyframe animations on an element, and on what is inside it, are changing. */
export async function animatedProperties(element: Locator): Promise<string[]> {
  const properties = await element.evaluate((root) =>
    [root, ...root.querySelectorAll('*')].flatMap((node) =>
      node.getAnimations().flatMap((animation) => {
        const effect = animation.effect;
        // Keyframe animations only: a transition, such as a focus ring fading in, is not one.
        return animation instanceof CSSAnimation && effect instanceof KeyframeEffect
          ? effect.getKeyframes().flatMap((frame) => Object.keys(frame))
          : [];
      }),
    ),
  );
  return [...new Set(properties.filter((property) => !KEYFRAME_BOOKKEEPING.has(property)))].sort();
}
