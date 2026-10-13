/**
 * Copies the API contract published by the backend into this repo, where the
 * types in src/lib/api/schema.d.ts are generated from it.
 *
 *   pnpm run api:sync                      from a sibling checkout of the backend
 *   pnpm run api:sync -- <path or URL>     from anywhere else
 *
 * The copy is committed, so a contract change shows up in review as a diff
 * next to the code that adapts to it.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const DEFAULT_SOURCE = '../agenda-backend/openapi/openapi.json';
const TARGET = new URL('../openapi/openapi.json', import.meta.url);

async function read(source) {
  if (!/^https?:\/\//.test(source)) {
    return readFile(source, 'utf8');
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`${source} answered ${String(response.status)}`);
  }
  return response.text();
}

const source = process.argv[2] ?? DEFAULT_SOURCE;
const contract = await read(source);

// Fail here, with the source named, instead of later inside the type generator.
const { openapi, paths } = JSON.parse(contract);
if (typeof openapi !== 'string' || typeof paths !== 'object') {
  throw new Error(`${source} is not an OpenAPI document`);
}

await mkdir(new URL('.', TARGET), { recursive: true });
await writeFile(TARGET, contract);
process.stdout.write(`Copied the API contract from ${source}\n`);
