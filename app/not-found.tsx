import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
export default function NotFound() {
  return (
    <SiteShell>
      <main id="main" className="page-width empty-result">
        <span className="eyebrow">404 · LẠC MẤT MỘT CHÚT</span>
        <h1>Bộ câu hỏi này chưa có.</h1>
        <p>Quay lại để chọn một cuộc vui khác nhé.</p>
        <Link className="button button-primary" href="/">
          Về chọn bộ
        </Link>
      </main>
    </SiteShell>
  );
}
