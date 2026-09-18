import { AiBuilder } from '@/components/ai-builder';
import { SiteShell } from '@/components/site-shell';
export const metadata = {
  title: 'Tạo bộ câu hỏi riêng cho nhóm bằng AI',
  description:
    'Nhập tên thành viên, chọn không khí và tạo câu hỏi Thật hay Thách dành riêng cho nhóm.',
  robots: { index: false, follow: true },
};
export default function AiBuilderPage() {
  return (
    <SiteShell>
      <main id="main" className="page-width">
        <AiBuilder />
      </main>
    </SiteShell>
  );
}
