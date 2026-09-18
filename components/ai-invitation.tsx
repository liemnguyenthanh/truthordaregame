import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
export function AiInvitation() {
  return (
    <section className="ai-invitation" aria-labelledby="ai-invitation-title">
      <div className="ai-invitation-icon">
        <Sparkles size={25} />
      </div>
      <div className="ai-invitation-copy">
        <h2 id="ai-invitation-title">Tạo bộ câu hỏi riêng bằng AI</h2>
        <p>Nhập tên nhóm và chọn chủ đề. AI sẽ tạo câu hỏi dành riêng cho bạn.</p>
      </div>
      <Link href="/vi/tao-bo-ai" className="button button-secondary">
        Tạo bộ bằng AI
        <ArrowUpRight size={18} />
      </Link>
    </section>
  );
}
