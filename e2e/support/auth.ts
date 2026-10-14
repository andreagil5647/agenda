import { join } from 'node:path';

/** Where the demo account's session is kept between the setup and the tests. */
export const AUTH_FILE = join(import.meta.dirname, '..', '.auth', 'demo.json');
