import { parseWebhook } from './validation';
export function apiTransaction(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Invalid API transaction');
  const v = value as Record<string, unknown>;
  const money = (amount: unknown) => {
    if (typeof amount !== 'string' || !/^\d+(?:\.0{1,2})?$/.test(amount))
      throw new Error('Invalid VND amount');
    return Number(amount);
  };
  const incoming = money(v.amount_in),
    outgoing = money(v.amount_out);
  if (incoming > 0 === outgoing > 0) throw new Error('Ambiguous transfer direction');
  if (typeof v.id !== 'string' || !/^\d+$/.test(v.id)) throw new Error('Invalid transaction ID');
  const payload = {
    id: Number(v.id),
    transferAmount: incoming || outgoing,
    transferType: incoming > 0 ? 'in' : 'out',
    accountNumber: v.account_number,
    gateway: v.bank_brand_name,
    transactionDate: v.transaction_date,
    code: v.code,
    content: v.transaction_content,
  };
  parseWebhook(payload);
  return payload;
}
export function vietnamTime(time: number) {
  return new Date(time + 7 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
}
/** v1 has no page/offset. Split full time windows and overlap their inclusive boundary. */
export async function collectTransactions(
  from: number,
  to: number,
  fetchWindow: (from: number, to: number) => Promise<unknown[]>,
  maxRequests = 15,
  pageSize = 5000,
) {
  const pending: Array<[number, number]> = [[from, to]],
    all = new Map<string, ReturnType<typeof apiTransaction>>();
  let requests = 0;
  while (pending.length) {
    if (requests >= maxRequests)
      throw new Error('Reconciliation window exceeds request budget; retry smaller windows');
    const [start, end] = pending.shift()!;
    const rows = await fetchWindow(start, end);
    requests++;
    if (rows.length >= pageSize) {
      if (end - start <= 1000)
        throw new Error('More than one page in a single second; manual reconciliation required');
      const middle = Math.floor((start + end) / 2000) * 1000;
      pending.push([start, middle], [middle, end]);
      continue;
    }
    for (const row of rows) {
      const parsed = apiTransaction(row);
      all.set(String(parsed.id), parsed);
    }
  }
  return { transactions: [...all.values()], requests };
}
