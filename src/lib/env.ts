/**
 * Reads the PUBLIC_ variables that config/webpack/env.ts inlines at build
 * time with DefinePlugin. Each reference below is a static member
 * expression (`process.env.PUBLIC_X`), which is what DefinePlugin matches
 * and replaces textually - no runtime `process` global exists in the bundle.
 */
export const env = {
  apiBaseUrl: process.env.PUBLIC_API_BASE_URL,
  appVersion: process.env.PUBLIC_APP_VERSION,
} as const;
