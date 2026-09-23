import { Restore } from '@/components/restore';
import { SiteShell } from '@/components/site-shell';
import { pageLocale, copy } from '@/lib/i18n/pages';
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const locale = await pageLocale(params);
  return {
    title: copy(locale, 'Khôi phục bộ đã mua', 'Restore purchases'),
    robots: { index: false, follow: true },
  };
}
export default async function RestorePage({ params }: Props) {
  const locale = await pageLocale(params);
  return (
    <SiteShell>
      <main id="main" className="page-width">
        <Restore />
      </main>
    </SiteShell>
  );
}
