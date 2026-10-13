import { existsSync } from 'node:fs';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/**
 * Only PUBLIC_-prefixed variables are ever exposed to the client bundle.
 * Anything else in the environment (CI tokens, the shell's PATH, ...) stays
 * out, even if a future .env file happens to define it.
 */
const publicEnvSchema = z.object({
  PUBLIC_APP_VERSION: z.string().default('dev'),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function loadPublicEnv(mode: 'development' | 'production'): PublicEnv {
  const envFile = mode === 'development' ? '.env' : '.env.production.local';
  if (existsSync(envFile)) {
    loadDotenv({ path: envFile });
  }

  const input = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith('PUBLIC_')),
  );

  const result = publicEnvSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid PUBLIC_ environment variables:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}

/** Values to inject with DefinePlugin, pre-stringified as JSON literals. */
export function toDefinePluginEnv(env: PublicEnv, mode: string): Record<string, string> {
  const defines: Record<string, string> = {
    'process.env.NODE_ENV': JSON.stringify(mode),
  };
  for (const [key, value] of Object.entries(env)) {
    defines[`process.env.${key}`] = JSON.stringify(value);
  }
  return defines;
}
