import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = await fs.readFile(path.join(dirname, 'schema.sql'), 'utf8');

for (const statement of schema.split(/;\s*$/m).map((part) => part.trim()).filter(Boolean)) {
  await pool.query(statement);
}

await pool.end();
console.log('Migracao concluida.');
