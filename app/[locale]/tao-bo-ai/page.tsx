import { notFound } from 'next/navigation';
import { AI_PACK_CREATION_ENABLED } from '@/lib/features';
import { AiBuilder } from '@/components/ai-builder';
import { SiteShell } from '@/components/site-shell';
import { pageLocale, copy } from '@/lib/i18n/pages';
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const locale = await pageLocale(params);
  return {
    title: copy(locale, 'Tạo bộ câu hỏi riêng cho nhóm bằng AI', 'Create an AI question pack'),
    robots: { index: false, follow: true },
  };
}
export default async function AiBuilderPage({ params }: Props) {
  if (!AI_PACK_CREATION_ENABLED) notFound();
  await pageLocale(params);
  return (
    <SiteShell>
      <main id="main" className="page-width">
        <AiBuilder />
      </main>
    </SiteShell>
  );
}
