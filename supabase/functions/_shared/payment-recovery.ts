import { createHash, randomBytes, createCipheriv } from 'node:crypto';
import { Buffer } from 'node:buffer';

/** Same iv | GCM tag | ciphertext encoding consumed by website orderView. */
export function createRecovery(key: string) {
  if (!/^[a-f\d]{64}$/i.test(key)) throw new Error('Invalid recovery encryption key');
  const raw = randomBytes(16).toString('hex').toUpperCase();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
  return {
    hash: createHash('sha256').update(raw).digest('hex'),
    ciphertext: Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64'),
  };
}
