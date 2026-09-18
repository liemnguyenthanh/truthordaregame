import { api, env, body, HttpError } from '@/lib/payments/server';
import { parseWebhook, validApiKey } from '@/lib/payments/validation';
import { processPayment } from '@/lib/payments/process';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return api(async () => {
    if (!validApiKey(req.headers.get('authorization'), env('SEPAY_WEBHOOK_API_KEY')))
      throw new HttpError(401, 'Không được phép.');
    const payload = await body(req);
    try {
      parseWebhook(payload);
    } catch {
      throw new HttpError(400, 'Webhook không hợp lệ.');
    }
    await processPayment(payload);
    return { success: true };
  });
}
