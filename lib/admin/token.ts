import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
export function equalSecret(a: string, b: string) {
  return timingSafeEqual(
    createHash('sha256').update(a).digest(),
    createHash('sha256').update(b).digest(),
  );
}
export function issueToken(password: string, now = Date.now()) {
  const expires = String(now + 8 * 60 * 60 * 1000);
  return (
    expires +
    '.' +
    createHmac('sha256', password)
      .update('tod-admin:' + expires)
      .digest('hex')
  );
}
export function validToken(token: string, password: string, now = Date.now()) {
  const [expires, signature, extra] = token.split('.');
  if (
    extra ||
    !/^\d{13}$/.test(expires || '') ||
    !/^[a-f0-9]{64}$/.test(signature || '') ||
    Number(expires) <= now ||
    Number(expires) > now + 8 * 60 * 60 * 1000
  )
    return false;
  return equalSecret(
    signature,
    createHmac('sha256', password)
      .update('tod-admin:' + expires)
      .digest('hex'),
  );
}
