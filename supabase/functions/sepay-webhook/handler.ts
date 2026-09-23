import { validApiKey, parseWebhook } from '../_shared/payment-validation.ts';
import { createRecovery } from '../_shared/payment-recovery.ts';

type Environment = (name: string) => string | undefined;
function json(status: number, value: unknown) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function createHandler(getEnv: Environment, fetcher: typeof fetch = fetch) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return json(405, { success: false, error: 'Method not allowed' });
    const env = (name: string) => {
      const value = getEnv(name);
      if (!value) throw new Error('Missing configuration');
      return value;
    };
    try {
      // SePay uses its own API key, so platform JWT verification is disabled.
      if (!validApiKey(req.headers.get('authorization'), env('SEPAY_WEBHOOK_API_KEY')))
        return json(401, { success: false, error: 'Unauthorized' });
      let event;
      try {
        const reader = req.body?.getReader();
        if (!reader) return json(400, { success: false, error: 'Missing body' });
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 16384) {
            await reader.cancel();
            return json(413, { success: false, error: 'Payload too large' });
          }
          chunks.push(value);
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        event = parseWebhook(JSON.parse(new TextDecoder().decode(bytes)));
      } catch {
        return json(400, { success: false, error: 'Invalid payload' });
      }
      const recovery = createRecovery(env('RECOVERY_ENCRYPTION_KEY'));
      const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
      const result = await fetcher(`${env('SUPABASE_URL')}/rest/v1/rpc/apply_payment`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_transaction: event.transactionId,
          p_code: event.paymentCode,
          p_amount: event.amount,
          p_bank_time: event.bankTime,
          p_direction: event.direction,
          p_account_valid:
            event.account === env('SEPAY_ACCOUNT_NUMBER') &&
            event.gateway.toLowerCase() === env('SEPAY_BANK_NAME').toLowerCase(),
          p_recovery_hash: recovery.hash,
          p_recovery_ciphertext: recovery.ciphertext,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!result.ok) throw new Error('Payment commit failed');
      await result.json();
      // Acknowledge only after the atomic RPC commits. Failures remain retryable.
      return json(200, { success: true });
    } catch {
      console.error('[sepay-webhook] Configuration or payment processing failed');
      return json(503, { success: false, error: 'Service temporarily unavailable' });
    }
  };
}
