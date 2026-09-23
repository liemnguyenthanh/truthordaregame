import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { requestLocale } from '@/lib/request-locale';
export default async function NotFound() {
  const locale = await requestLocale();
  const english = locale === 'en';
  return (
    <SiteShell>
      <main id="main" className="page-width empty-result">
        <span className="eyebrow">
          {english ? '404 · A LITTLE LOST' : '404 · LẠC MẤT MỘT CHÚT'}
        </span>
        <h1>{english ? 'This page is not available.' : 'Bộ câu hỏi này chưa có.'}</h1>
        <p>
          {english
            ? 'Head back and choose another pack.'
            : 'Quay lại để chọn một cuộc vui khác nhé.'}
        </p>
        <Link className="button button-primary" href={`/${locale}`}>
          {english ? 'Choose a pack' : 'Về chọn bộ'}
        </Link>
      </main>
    </SiteShell>
  );
}
