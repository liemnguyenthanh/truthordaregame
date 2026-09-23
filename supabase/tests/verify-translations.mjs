import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for (const file of (await readdir('supabase/migrations'))
    .filter(
      (f) =>
        f.endsWith('_commerce.sql') ||
        f.endsWith('_content_admin.sql') ||
        f.endsWith('_content_translations.sql'),
    )
    .sort())
    await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
  const {
    rows: [source],
  } = await db.query("select * from content_packs where id='friends-free'");
  const {
    rows: [seeded],
  } = await db.query(
    "select revision from content_pack_translations where pack_id='friends-free' and locale='en'",
  );
  assert.ok(seeded.revision.startsWith('en-bundled-'));
  assert.equal(
    (await db.query('select count(*)::int as n from content_pack_translations')).rows[0].n,
    3,
  );
  const questionSet = { ...source.question_set, locale: 'en', contentVersion: 'test-en' };
  questionSet.questions = questionSet.questions.map((q) => ({ ...q, text: 'English: ' + q.id }));
  const metadata = {
    ...source.metadata,
    locale: 'en',
    contentVersion: 'test-en',
    title: 'English title',
    priceHintVnd: 999999,
    questionFile: '/content/questions/friends-free/test-en?locale=en',
  };
  const save = async (expected, revision, set = questionSet) =>
    (
      await db.query('select save_content_translation($1::jsonb,$2::jsonb,$3,$4) as result', [
        JSON.stringify(metadata),
        JSON.stringify(set),
        expected,
        revision,
      ])
    ).rows[0].result;
  await db.exec('set role service_role');
  assert.equal((await save(null, 'outdated')).error, 'source_conflict');
  assert.equal(
    (
      await save(null, source.revision, {
        ...questionSet,
        questions: questionSet.questions.slice(1),
      })
    ).error,
    'question_identity_mismatch',
  );
  const result = await save(seeded.revision, source.revision);
  assert.equal(result.ok, true);
  assert.equal(result.metadata.priceHintVnd, source.metadata.priceHintVnd);
  assert.equal(result.metadata.id, source.id);
  assert.equal((await save(null, source.revision)).error, 'conflict');
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from content_pack_translation_versions where version='test-en'",
      )
    ).rows[0].n,
    1,
  );
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query('select * from content_pack_translations'), /permission denied/);
    await assert.rejects(save('test-en', source.revision), /permission denied/);
  }
  console.log(
    'PASS translations: source concurrency, ID parity, immutable versions, price isolation, RLS and RPC grants.',
  );
} finally {
  await db.close();
}
