import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('recovery expires at seven days without revoking existing access or extending on restore', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      'create role anon; create role authenticated; create role service_role bypassrls;',
    );
    await db.exec(await readFile('supabase/migrations/20260918065848_commerce.sql', 'utf8'));
    await db.exec(`
      insert into guest_sessions(id,token_hash) values
        ('00000000-0000-0000-0000-000000000001','owner'),
        ('00000000-0000-0000-0000-000000000002','new-device');
      insert into orders(id,guest_id,product_id,pack_id,amount_vnd,title_snapshot,price_version,payment_code)
        select '00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001',id,pack_id,price_vnd,title,price_version,'TODTEST' from products limit 1;
      insert into purchases(order_id,pack_id,recovery_hash,recovery_ciphertext)
        select id,pack_id,'secret','encrypted' from orders;
      insert into entitlements(guest_id,purchase_id,pack_id)
        select '00000000-0000-0000-0000-000000000001',id,pack_id from purchases;
    `);
    await db.exec(
      await readFile('supabase/migrations/20260923074703_recovery_code_expiry.sql', 'utf8'),
    );
    await db.exec('begin');
    for (const [age, valid] of [
      ['6 days 23 hours 59 minutes 59 seconds', true],
      ['7 days', false],
      ['8 days', false],
    ] as const) {
      await db.exec(
        `delete from entitlements where guest_id='00000000-0000-0000-0000-000000000002';`,
      );
      await db.query('update purchases set created_at=now()-$1::interval', [age]);
      const { rows } = await db.query<{ pack: string | null }>(
        "select restore_purchase('00000000-0000-0000-0000-000000000002','secret') as pack",
      );
      assert.equal(rows[0].pack !== null, valid);
      const { rows: grants } = await db.query<{ count: number }>(
        'select count(*)::int as count from entitlements where revoked_at is null',
      );
      assert.equal(grants[0].count, valid ? 2 : 1);
      const { rows: unchanged } = await db.query<{ unchanged: boolean }>(
        'select created_at=now()-$1::interval as unchanged from purchases',
        [age],
      );
      assert.equal(unchanged[0].unchanged, true);
    }
    await db.exec('rollback');
    const { rows } = await db.query<{ allowed: boolean }>(
      "select has_function_privilege('anon','public.restore_purchase(uuid,text)','EXECUTE') as allowed",
    );
    assert.equal(rows[0].allowed, false);
  } finally {
    await db.close();
  }
});
