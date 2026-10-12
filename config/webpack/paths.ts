import { fileURLToPath } from 'node:url';

// This file itself lives at config/webpack/paths.ts, so the project root is
// two directories up. Resolved once here rather than repeated with '../..'
// in every config file.
const root = fileURLToPath(new URL('../..', import.meta.url));

export const paths = {
  root,
  src: `${root}/src`,
  entry: `${root}/src/index.tsx`,
  htmlTemplate: `${root}/src/index.html`,
  publicDir: `${root}/public`,
  dist: `${root}/dist`,
};
