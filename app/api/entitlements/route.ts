import { api, guest, db, check, decrypt } from '@/lib/payments/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return api(async () => {
    const id = await guest();
    const { data, error } = await db()
      .from('entitlements')
      .select('pack_id,purchases!inner(status,recovery_ciphertext,expires_at)')
      .eq('guest_id', id)
      .is('revoked_at', null)
      .eq('purchases.status', 'active')
      .gt('purchases.expires_at', new Date().toISOString());
    check(error);
    const purchases = (data ?? []).map((row) => {
      const purchase = row.purchases as unknown as {
        recovery_ciphertext: string;
        expires_at: string;
      };
      return {
        packId: row.pack_id,
        recoveryCode: decrypt(purchase.recovery_ciphertext),
        expiresAt: purchase.expires_at,
      };
    });
    return { packIds: [...new Set(purchases.map((p) => p.packId))], purchases };
  });
}
