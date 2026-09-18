import { timingSafeEqual } from 'node:crypto';
import { api, env, HttpError, limit } from '@/lib/payments/server';
import { collectTransactions, vietnamTime } from '@/lib/payments/reconcile';
import { processPayment } from '@/lib/payments/process';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(req: Request) {
  return api(async () => {
    const expected = Buffer.from(`Bearer ${env('CRON_SECRET')}`),
      actual = Buffer.from(req.headers.get('authorization') ?? '');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw new HttpError(401, 'Không được phép.');
    const token = env('SEPAY_API_TOKEN'),
      account = env('SEPAY_ACCOUNT_NUMBER');
    env('SEPAY_BANK_NAME');
    env('RECOVERY_ENCRYPTION_KEY');
    await limit('internal-reconcile', 2);
    const url = new URL(req.url),
      now = Date.now(),
      deadline = now + 45000;
    const to = url.searchParams.has('to') ? Date.parse(url.searchParams.get('to')!) : now;
    const from = url.searchParams.has('from')
      ? Date.parse(url.searchParams.get('from')!)
      : to - 48 * 3600000;
    if (
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      from >= to ||
      to > now + 60000 ||
      to - from > 72 * 3600000
    )
      throw new HttpError(400, 'Khoảng đối soát phải hợp lệ và không quá 72 giờ.');
    let lastRequest = 0;
    const { transactions, requests } = await collectTransactions(
      Math.floor(from / 1000) * 1000,
      Math.floor(to / 1000) * 1000,
      async (start, end) => {
        if (Date.now() > deadline)
          throw new HttpError(503, 'Đối soát hết thời gian. Vui lòng chạy lại khoảng nhỏ hơn.');
        const pause = 400 - (Date.now() - lastRequest);
        if (pause > 0) await new Promise((resolve) => setTimeout(resolve, pause));
        lastRequest = Date.now();
        const query = new URLSearchParams({
          account_number: account,
          transaction_date_min: vietnamTime(start),
          transaction_date_max: vietnamTime(end),
          limit: '5000',
        });
        const response = await fetch(`https://my.sepay.vn/userapi/transactions/list?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok)
          throw new HttpError(503, 'SePay chưa trả dữ liệu đối soát. Vui lòng thử lại.');
        const payload = await response.json();
        if (payload.status !== 200 || payload.error || !Array.isArray(payload.transactions))
          throw new HttpError(503, 'Phản hồi đối soát SePay không hợp lệ.');
        return payload.transactions;
      },
    );
    if (transactions.length > 300)
      throw new HttpError(503, 'Có quá nhiều giao dịch. Hãy đối soát khoảng thời gian nhỏ hơn.');
    const outcomes: Record<string, number> = {};
    for (const transaction of transactions) {
      if (Date.now() > deadline)
        throw new HttpError(503, 'Đối soát hết thời gian. Vui lòng chạy lại khoảng nhỏ hơn.');
      const outcome = await processPayment(transaction);
      outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
    }
    return {
      ok: true,
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
      requests,
      processed: transactions.length,
      outcomes,
    };
  });
}
