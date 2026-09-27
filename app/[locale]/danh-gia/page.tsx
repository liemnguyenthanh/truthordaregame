import { SiteShell } from '@/components/site-shell';
import { Reviews } from '@/components/reviews';
import { pageLocale, copy } from '@/lib/i18n/pages';
import { pageMetadata } from '@/lib/seo';
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const locale = await pageLocale(params);
  return pageMetadata(
    copy(locale, 'Đánh giá từ người chơi', 'Player reviews'),
    copy(
      locale,
      'Cảm nhận thật lòng từ người chơi Thật hay Thách.',
      'Honest feedback from Truth or Dare players.',
    ),
    '/vi/danh-gia',
    locale,
  );
}
export default async function ReviewsPage({ params }: Props) {
  await pageLocale(params);
  return (
    <SiteShell>
      <main id="main" className="page-width">
        <Reviews />
      </main>
    </SiteShell>
  );
}
