import { Suspense } from 'react';
import { GeneratedPackView } from '@/components/generated-pack';
import { SiteHeader } from '@/components/site-shell';
import { pageLocale, copy } from '@/lib/i18n/pages';
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const locale = await pageLocale(params);
  return {
    title: copy(locale, 'Bộ câu hỏi riêng của nhóm', 'Your private group pack'),
    robots: { index: false, follow: false },
  };
}
export default async function AiPackPage({ params }: Props) {
  const locale = await pageLocale(params);
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Suspense
          fallback={
            <p className="notice page-width">
              {copy(locale, 'Đang mở bộ câu hỏi của nhóm…', 'Opening your group pack…')}
            </p>
          }
        >
          <GeneratedPackView />
        </Suspense>
      </main>
    </>
  );
}
