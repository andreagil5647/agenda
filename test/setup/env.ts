// Webpack inlines PUBLIC_ variables at build time (config/webpack/env.ts).
// Jest has no such step, so they are set here before any module loads.
process.env.PUBLIC_APP_VERSION = 'test';
