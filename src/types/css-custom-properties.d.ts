import 'react';

declare module 'react' {
  // Lets a component pass per-instance values to its stylesheet as custom
  // properties, such as a block's start time, without a type assertion.
  // Extending React's interface needs an index signature; a Record cannot merge.
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number;
  }
}
