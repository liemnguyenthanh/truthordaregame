import { timingSafeEqual } from 'node:crypto';
export function validApiKey(header: string | null, secret: string): boolean {
  const actual = Buffer.from(header ?? ''); const expected = Buffer.from(`Apikey ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function normalizeRecovery(code: string): string { return code.toUpperCase().replace(/[\s-]/g, ''); }
export function parseWebhook(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Payload không hợp lệ');
  const v = value as Record<string, unknown>;
  if (!Number.isSafeInteger(v.id) || Number(v.id) <= 0 || !Number.isSafeInteger(v.transferAmount) || Number(v.transferAmount) <= 0 || !['in','out'].includes(String(v.transferType)) || typeof v.accountNumber !== 'string' || typeof v.gateway !== 'string' || typeof v.transactionDate !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v.transactionDate)) throw new Error('Payload không hợp lệ');
  const bankTime = new Date(v.transactionDate.replace(' ', 'T') + '+07:00');
  if (!Number.isFinite(bankTime.getTime()) || new Date(bankTime.getTime() + 7 * 3600000).toISOString().slice(0,19).replace('T',' ') !== v.transactionDate) throw new Error('Ngày giao dịch không hợp lệ');
  const codes: string[] = String(v.content ?? '').toUpperCase().match(/\bTOD[A-F0-9]{10}\b/g) ?? [];
  if (typeof v.code === 'string' && /^TOD[A-F0-9]{10}$/.test(v.code.toUpperCase())) codes.push(v.code.toUpperCase());
  const unique = [...new Set(codes)];
  return { transactionId:String(v.id), amount:Number(v.transferAmount), direction:String(v.transferType), account:v.accountNumber, gateway:v.gateway, bankTime:bankTime.toISOString(), paymentCode:unique.length === 1 ? unique[0] : null };
}
