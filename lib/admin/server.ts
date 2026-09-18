import 'server-only';
import { cookies } from 'next/headers';
import { HttpError } from '@/lib/db/server';
import { validToken } from './token';
export const ADMIN_COOKIE = 'tod_admin';
export function adminPassword() {
  const value = process.env.ADMIN_PASSWORD;
  if (!value || value.length < 16)
    throw new HttpError(503, 'Hãy cấu hình ADMIN_PASSWORD ít nhất 16 ký tự trên server.');
  return value;
}
export async function isAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!token && validToken(token, adminPassword());
}
export async function requireAdmin() {
  if (!(await isAdmin())) throw new HttpError(401, 'Vui lòng đăng nhập quản trị.');
}
