import 'server-only';
import { createClient } from '@supabase/supabase-js';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function env(name: string) {
  const value = process.env[name];
  if (!value)
    throw new HttpError(
      503,
      'Thanh toán chưa được cấu hình. Bạn vẫn có thể chơi miễn phí và chơi thử.',
    );
  return value;
}
export function db() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function check(error: { message: string } | null) {
  if (error) throw new HttpError(503, 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.');
}
