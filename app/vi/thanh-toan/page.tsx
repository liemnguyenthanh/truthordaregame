import { Suspense } from 'react';
import { Checkout } from '@/components/checkout';
import { SiteShell } from '@/components/site-shell';
export const metadata = { title: 'Mở khóa bộ câu hỏi', robots: { index: false, follow: true } };
export default function CheckoutPage() {
  return (
    <SiteShell>
      <main id="main" className="page-width">
        <Suspense fallback={<p className="notice">Đang tải thanh toán…</p>}>
          <Checkout />
        </Suspense>
      </main>
    </SiteShell>
  );
}
