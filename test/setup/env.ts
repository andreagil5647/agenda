// Webpack inlines PUBLIC_ variables at build time (config/webpack/env.ts).
// Jest has no such step, so the same defaults are set here before any module loads.
process.env.PUBLIC_API_BASE_URL = '/api/v1';
process.env.PUBLIC_APP_VERSION = 'test';
