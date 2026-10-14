import { resetDevice, setDevice } from '../../../test/helpers/device';
import { revealFrom } from './themeTransition';

type Callback = () => void;

interface FakeTransition {
  ready: Promise<void>;
}

function origin(): Element {
  const button = document.createElement('button');
  jest.spyOn(button, 'getBoundingClientRect').mockReturnValue({
    left: 20,
    top: 700,
    width: 40,
    height: 40,
  } as DOMRect);
  return button;
}

/** A browser that has view transitions: the update runs, and the reveal can start. */
function browserWithTransitions(ready: Promise<void> = Promise.resolve()): {
  start: jest.Mock<FakeTransition, [Callback]>;
  animate: jest.Mock<undefined, [PropertyIndexedKeyframes, KeyframeAnimationOptions]>;
} {
  const start = jest.fn((update: Callback): FakeTransition => {
    update();
    return { ready };
  });
  const animate = jest.fn<undefined, [PropertyIndexedKeyframes, KeyframeAnimationOptions]>();
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
  Object.defineProperty(document.documentElement, 'animate', {
    configurable: true,
    value: animate,
  });
  return { start, animate };
}

const { innerWidth, innerHeight } = window;

beforeEach(() => {
  window.innerWidth = 1000;
  window.innerHeight = 800;
});

afterEach(() => {
  window.innerWidth = innerWidth;
  window.innerHeight = innerHeight;
  Reflect.deleteProperty(document, 'startViewTransition');
  Reflect.deleteProperty(document.documentElement, 'animate');
  resetDevice();
  jest.restoreAllMocks();
});

describe('revealing a change from an element', () => {
  it('makes the change at once in a browser without view transitions', () => {
    const change = jest.fn();

    revealFrom(origin(), change);

    expect(change).toHaveBeenCalledTimes(1);
  });

  it('makes the change inside a view transition and grows a circle from the middle of the element', async () => {
    const { start, animate } = browserWithTransitions();
    const change = jest.fn();

    revealFrom(origin(), change);
    await Promise.resolve();

    expect(start).toHaveBeenCalledWith(change);
    expect(change).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes, options] = animate.mock.calls[0] ?? [];
    // From the middle of the element (40, 720) to the farthest corner, the top right: 960 across, 720 down.
    expect(keyframes?.clipPath).toEqual([
      'circle(0px at 40px 720px)',
      'circle(1200px at 40px 720px)',
    ]);
    expect(options?.pseudoElement).toBe('::view-transition-new(root)');
  });

  it('makes the change with no circle when the reader asked for less motion', () => {
    const { start, animate } = browserWithTransitions();
    setDevice({ reducedMotion: true });
    const change = jest.fn();

    revealFrom(origin(), change);

    expect(change).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
  });

  it('is not troubled by a transition the browser skipped', async () => {
    const { animate } = browserWithTransitions(Promise.reject(new Error('skipped')));

    expect(() => {
      revealFrom(origin(), jest.fn());
    }).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(animate).not.toHaveBeenCalled();
  });
});
