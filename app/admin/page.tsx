import { AdminPanel } from '@/components/admin-panel';
import { isAdmin } from '@/lib/admin/server';
import './admin.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Quản trị bộ câu hỏi', robots: { index: false, follow: false } };
export default async function AdminPage() {
  return <AdminPanel authenticated={await isAdmin()} />;
}
