// Run after `npx supabase login`: node --env-file=.env scripts/set-sepay-secrets.mjs
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const names = [
  'SEPAY_WEBHOOK_API_KEY',
  'SEPAY_BANK_NAME',
  'SEPAY_ACCOUNT_NUMBER',
  'RECOVERY_ENCRYPTION_KEY',
];
const ref = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
if (!/^[a-z]{20}$/.test(ref)) throw new Error('Invalid Supabase project URL');
for (const name of names) {
  if (!process.env[name] || /[\r\n]/.test(process.env[name]))
    throw new Error(`Missing or invalid ${name}`);
}
const directory = mkdtempSync(join(tmpdir(), 'tod-sepay-'));
try {
  const file = join(directory, '.env');
  writeFileSync(
    file,
    names.map((name) => `${name}=${JSON.stringify(process.env[name])}`).join('\n'),
    { mode: 0o600 },
  );
  const result = spawnSync(
    'npx',
    ['--yes', 'supabase', 'secrets', 'set', '--project-ref', ref, '--env-file', file],
    { stdio: 'inherit' },
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
