import { Restore } from '@/components/restore';
import { SiteShell } from '@/components/site-shell';
export const metadata = { title: 'Khôi phục bộ đã mua', robots: { index: false, follow: true } };
export default function RestorePage() {
  return (
    <SiteShell>
      <main id="main" className="page-width">
        <Restore />
      </main>
    </SiteShell>
  );
}
