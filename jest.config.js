// Plain ESM JS, not .ts: Jest's own config loader hard-requires ts-node for
// TypeScript config files, and pulling in a second TS transpiler just to
// load one config object is not worth it when SWC already does the job
// everywhere else (webpack, this file's own transform below).

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic', development: true } },
          target: 'es2022',
        },
        // Webpack needs ES modules for tree-shaking (see .swcrc); Jest runs
        // under CommonJS, so only this transform target differs.
        module: { type: 'commonjs' },
        sourceMaps: 'inline',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Styles are not under test. A CSS Module resolves every class to its own
    // name, so markup keeps readable class attributes; global sheets are empty.
    '\\.module\\.css$': '<rootDir>/test/setup/cssModuleStub.cjs',
    '\\.css$': '<rootDir>/test/setup/styleStub.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.tsx'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
};

export default config;
