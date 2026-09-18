import { api, guest, db, check, decrypt } from '@/lib/payments/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return api(async () => {
    const id = await guest();
    const { data, error } = await db()
      .from('entitlements')
      .select('pack_id,purchases!inner(status,recovery_ciphertext)')
      .eq('guest_id', id)
      .is('revoked_at', null)
      .eq('purchases.status', 'active');
    check(error);
    const purchases = (data ?? []).map((row) => {
      const purchase = row.purchases as unknown as { recovery_ciphertext: string };
      return { packId: row.pack_id, recoveryCode: decrypt(purchase.recovery_ciphertext) };
    });
    return { packIds: [...new Set(purchases.map((p) => p.packId))], purchases };
  });
}
