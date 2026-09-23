import { Suspense } from 'react';
import { Checkout } from '@/components/checkout';
import { SiteShell } from '@/components/site-shell';
import { pageLocale, copy } from '@/lib/i18n/pages';
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const locale = await pageLocale(params);
  return {
    title: copy(locale, 'Mở khóa bộ câu hỏi', 'Unlock a question pack'),
    robots: { index: false, follow: true },
  };
}
export default async function CheckoutPage({ params }: Props) {
  const locale = await pageLocale(params);
  return (
    <SiteShell>
      <main id="main" className="page-width">
        <Suspense
          fallback={
            <p className="notice">{copy(locale, 'Đang tải thanh toán…', 'Loading checkout…')}</p>
          }
        >
          <Checkout />
        </Suspense>
      </main>
    </SiteShell>
  );
}
