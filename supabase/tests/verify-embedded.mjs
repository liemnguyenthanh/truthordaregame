// npm install --prefix /tmp/tod-db-verify --no-audit --no-fund @electric-sql/pglite
// node supabase/tests/verify-embedded.mjs
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const { PGlite } = createRequire('/tmp/tod-db-verify/package.json')('@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await db.exec(await readFile(`${root}/supabase/migrations/20260918065848_commerce.sql`, 'utf8'));
  await db.exec(await readFile(`${root}/supabase/tests/commerce.sql`, 'utf8'));
  console.log(
    'PASS: migration, service-role RPCs, idempotency, restore, wrong amount, rollback/retry, rate limits, RLS/privilege assertions.',
  );
} catch (error) {
  console.error({
    message: error.message,
    code: error.code,
    detail: error.detail,
    where: error.where,
  });
  process.exitCode = 1;
} finally {
  await db.close();
}
