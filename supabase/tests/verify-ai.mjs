import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const { PGlite } = createRequire('/tmp/tod-db-verify/package.json')('@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for (const path of [
    'migrations/20260918065848_commerce.sql',
    'migrations/20260918065856_ai_generations.sql',
    'tests/ai-generations.sql',
  ])
    await db.exec(await readFile(`${root}/supabase/${path}`, 'utf8'));
  console.log(
    'PASS: AI reservation identity, conflict, single pending, expiry, guest/IP/global quota, private grants.',
  );
} catch (error) {
  console.error({ message: error.message, code: error.code, where: error.where });
  process.exitCode = 1;
} finally {
  await db.close();
}
