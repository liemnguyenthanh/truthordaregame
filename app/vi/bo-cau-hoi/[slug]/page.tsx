import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Users, Layers, Check } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { StructuredData } from '@/components/structured-data';
import { getPacks, getPack, getQuestionSet } from '@/lib/content';
import { pageMetadata, siteUrl } from '@/lib/seo';
export const dynamicParams = false;
export function generateStaticParams() {
  return getPacks().map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPack((await params).slug);
  return p ? pageMetadata(p.title, p.description, `/vi/bo-cau-hoi/${p.slug}`) : {};
}
export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPack((await params).slug);
  if (!p) notFound();
  const set = getQuestionSet(p);
  const samples = set.questions
    .filter((q) => p.tier === 'free' || set.trialQuestionIds.includes(q.id))
    .slice(0, 2);
  return (
    <SiteShell>
      <main id="main" className="page-width content-page">
        <Link className="back-link" href="/vi">
          ← Khám phá bộ câu hỏi
        </Link>
        <div className="pack-detail">
          <div className={`detail-art ${p.color}`}>
            <span>{p.icon}</span>
            <strong>{p.title}</strong>
            <small>THẬT HAY THÁCH</small>
          </div>
          <div className="detail-copy">
            <span className="eyebrow">
              {p.tier === 'free' ? 'MỞ MIỄN PHÍ TOÀN BỘ' : 'THỬ 8 CÂU MIỄN PHÍ'}
            </span>
            <h1>{p.title}</h1>
            <p>{p.description}</p>
            <div className="detail-facts">
              <span>
                <Layers size={17} />
                {p.questionCount} câu · {p.truthCount} Thật + {p.dareCount} Thách
              </span>
              <span>
                <Users size={17} />
                {p.playerRange.min}–{p.playerRange.max} người · {p.ageLabel}
              </span>
            </div>
            <a href={`/vi/choi/${p.slug}`} className="button button-primary">
              {p.tier === 'free' ? 'Bắt đầu chơi' : 'Chơi thử ngay'}
              <ArrowRight size={18} />
            </a>
            <p className="small-note">
              {p.tier === 'free'
                ? 'Chơi thoải mái. Không cần đăng ký.'
                : 'Mua một lần để mở bộ này. Giá được xác nhận tại thanh toán.'}
            </p>
          </div>
        </div>
        <section className="detail-section">
          <span className="eyebrow">MỘT CHÚT BẬT MÍ</span>
          <h2>Có gì trong bộ này?</h2>
          <div className="sample-grid">
            {samples.map((q) => (
              <div className={`sample-card ${q.type}`} key={q.id}>
                <span>{q.type === 'truth' ? '💭 Thật' : '💖 Thách'}</span>
                <p>{q.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="detail-section two-column">
          <div>
            <h2>Chơi theo cách của bạn</h2>
            <p>
              Mọi người ngồi thành vòng tròn, lần lượt chọn Thật hoặc Thách. Đọc to câu hỏi và cùng
              tận hưởng những câu chuyện bất ngờ.
            </p>
            <Link href="/vi/cach-choi" className="text-link">
              Đọc hướng dẫn chơi →
            </Link>
          </div>
          <ul className="benefit-list">
            <li>
              <Check size={18} />
              Câu hỏi không lặp trong cùng ván
            </li>
            <li>
              <Check size={18} />
              Luôn có thể bỏ qua
            </li>
            <li>
              <Check size={18} />
              Lưu bộ để chơi khi không có mạng
            </li>
            <li>
              <Check size={18} />
              {p.tier === 'free'
                ? 'Chơi lại miễn phí bất cứ lúc nào'
                : 'Giữ mã khôi phục để đổi thiết bị'}
            </li>
          </ul>
        </section>
      </main>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: siteUrl + '/vi' },
            {
              '@type': 'ListItem',
              position: 2,
              name: p.title,
              item: siteUrl + '/vi/bo-cau-hoi/' + p.slug,
            },
          ],
        }}
      />
    </SiteShell>
  );
}
