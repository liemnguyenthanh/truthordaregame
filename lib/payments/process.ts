import 'server-only';
import { db,env,check,recovery } from '@/lib/payments/server';
import { parseWebhook } from '@/lib/payments/validation';
/** Webhook and reconciler share validation, bank matching and the same transaction ID namespace. */
export async function processPayment(payload:unknown) {
 const event=parseWebhook(payload);const secret=recovery();
 const {data,error}=await db().rpc('apply_payment',{p_transaction:event.transactionId,p_code:event.paymentCode,p_amount:event.amount,p_bank_time:event.bankTime,p_direction:event.direction,p_account_valid:event.account===env('SEPAY_ACCOUNT_NUMBER')&&event.gateway.toLowerCase()===env('SEPAY_BANK_NAME').toLowerCase(),p_recovery_hash:secret.hash,p_recovery_ciphertext:secret.ciphertext});
 check(error);return String(data);
}
