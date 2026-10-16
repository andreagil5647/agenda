import { resetDevice, setDevice } from '../../../test/helpers/device';
import { prefersReducedMotion } from './reducedMotion';

afterEach(resetDevice);

describe('prefersReducedMotion', () => {
  it('is false by default', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('is true for a device whose owner asked for less motion', () => {
    setDevice({ reducedMotion: true });

    expect(prefersReducedMotion()).toBe(true);
  });
});
