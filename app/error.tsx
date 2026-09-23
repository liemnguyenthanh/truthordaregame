'use client';
import { useI18n } from '@/components/locale-provider';
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { locale, path } = useI18n();
  const english = locale === 'en';
  return (
    <main id="main" className="page-width empty-result">
      <h1>{english ? 'Something interrupted the game' : 'Có chút gián đoạn'}</h1>
      <p>
        {english
          ? 'Your saved progress is still on this device. Please try again.'
          : 'Tiến độ đã lưu vẫn ở trên thiết bị. Hãy thử tải lại nhé.'}
      </p>
      <button className="button button-primary" onClick={reset}>
        {english ? 'Try again' : 'Thử lại'}
      </button>
      <a className="back-link" href={path('/vi')}>
        {english ? 'Choose a pack' : 'Về chọn bộ'}
      </a>
    </main>
  );
}
