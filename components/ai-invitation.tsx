import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
export function AiInvitation() {
  return (
    <section className="ai-invitation" aria-labelledby="ai-invitation-title">
      <div className="ai-invitation-icon">
        <Sparkles size={25} />
      </div>
      <div className="ai-invitation-copy">
        <span className="eyebrow">VIẾT RIÊNG CHO NHÓM BẠN</span>
        <h2 id="ai-invitation-title">Câu hỏi có tên mình. Cuộc vui có chuyện riêng.</h2>
        <p>
          Thêm thành viên, chọn mood. Để AI kết nối cả nhóm bằng những câu Thật và Thách dành riêng
          cho từng người.
        </p>
      </div>
      <Link href="/vi/tao-bo-ai" className="button button-secondary">
        Tạo bộ bằng AI
        <ArrowUpRight size={18} />
      </Link>
    </section>
  );
}
