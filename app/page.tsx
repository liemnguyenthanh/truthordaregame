import Link from 'next/link';
import { ArrowRight, Zap, Download, Heart } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { PackLibrary } from '@/components/pack-library';
import { StructuredData } from '@/components/structured-data';
import { getPacks } from '@/lib/live-content';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: {
      default: 'Thật hay Thách — Chọn một câu, gần nhau hơn',
      template: '%s | Thật hay Thách',
    },
    description:
      'Bộ câu hỏi Thật hay Thách cho bạn bè và cặp đôi. Chơi miễn phí, không cần đăng nhập, ngay trên điện thoại.',
    alternates: {
      canonical: `${siteUrl}/`,
    },
    openGraph: {
      title: 'Thật hay Thách — Chọn một câu, gần nhau hơn',
      description:
        'Chơi Thật hay Thách cùng bạn bè và người thương. Chọn bộ câu hỏi, chơi ngay không cần tài khoản.',
      url: siteUrl,
      siteName: 'Thật hay Thách',
      locale: 'vi_VN',
      type: 'website',
      images: [{ url: '/share.png', width: 1200, height: 630, type: 'image/png', alt: 'Thật hay Thách' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Thật hay Thách — Chọn một câu, gần nhau hơn',
      description: 'Chơi Thật hay Thách cùng bạn bè và người thương.',
      images: ['/share.png'],
    },
  };
}

export default async function Home() {
  const packs = await getPacks('vi');
  const starter = packs.find((p) => p.tier === 'free');
  const faq = [
    [
      'Thật hay Thách chơi như thế nào?',
      'Mỗi người lần lượt chọn Thật để trả lời một câu hỏi hoặc Thách để thực hiện thử thách. Mọi người có thể bỏ qua bất cứ lúc nào. Không có điểm số hay người thắng cuộc.',
    ],
    [
      'Có cần tải ứng dụng hoặc đăng ký không?',
      'Không. Bạn chơi ngay trong trình duyệt, không cần tài khoản. Có thể thêm vào màn hình chính và lưu bộ câu hỏi để chơi khi không có mạng.',
    ],
    [
      'Bộ premium khác gì bộ miễn phí?',
      'Bộ miễn phí mở toàn bộ câu hỏi. Mỗi bộ premium có 8 câu chơi thử; thanh toán một lần để mở phần còn lại và chơi lại không giới hạn. Giá được xác nhận trước khi thanh toán.',
    ],
  ];

  return (
    <SiteShell>
      <main id="main" className="page-width home">
        <section className="intro">
          <div className="intro-copy">
            <span className="eyebrow">
              <span className="tiny-spark">✦</span>{' '}CUỘC VUI BẮT ĐẦU TỪ MỘT CÂU HỎI
            </span>
            <h1>
              Bớt ngại ngùng.
              <br />
              <span>Thêm gần nhau.</span>
            </h1>
            <p>
              Chọn Thật để hiểu nhau hơn, chọn Thách để cùng bật cười.
              <br className="desktop-break" />{' '}
              Một chiếc điện thoại là đủ cho cả cuộc vui.
            </p>
            <div className="intro-actions">
              <a
                className="button button-primary"
                href={starter ? `/choi/${starter.slug}` : '/cach-choi'}
              >
                {starter ? 'Chơi ngay miễn phí' : 'Xem cách chơi'}
                <ArrowRight size={19} />
              </a>
              <a
                className="group-start"
                href={starter ? `/choi/${starter.slug}?group=1` : '/danh-muc'}
              >
                {starter ? 'Tạo nhóm & chơi →' : 'Khám phá danh mục →'}
              </a>
              <a className="button button-secondary ai-start" href="/tao-bo-ai">
                Tạo bộ câu hỏi bằng AI
                <ArrowRight size={17} />
              </a>
            </div>
            <div className="intro-notes">
              <span>
                <Zap size={14} />
                Không cần tài khoản
              </span>
              <span>
                <Download size={14} />
                Chơi cả khi offline
              </span>
            </div>
          </div>
          <div className="intro-cards" aria-hidden="true">
            <div className="mini-card mini-truth">
              <span>💭 THẬT</span>
              <p>Ấn tượng đầu tiên của bạn về mình?</p>
              <small>THÀNH THẬT MỘT CHÚT</small>
            </div>
            <div className="mini-card mini-dare">
              <span>💖 THÁCH</span>
              <p>Thử làm cả nhóm cười trong 10 giây.</p>
              <small>CAN ĐẢM MỘT CHÚT</small>
            </div>
            <span className="floating-spark">✦</span>
          </div>
        </section>
        {packs.length ? (
          <PackLibrary packs={packs} />
        ) : (
          <section className="library">
            <h2>Bộ câu hỏi đang được chuẩn bị</h2>
            <p>
              Chưa có bộ câu hỏi được xuất bản. Bạn có thể đọc cách chơi trong lúc chờ.
            </p>
            <Link href="/cach-choi">Xem cách chơi →</Link>
          </section>
        )}
        <section className="how-strip">
          <div className="how-heart">
            <Heart size={22} />
          </div>
          <div>
            <h2>Không cần giỏi chơi. Chỉ cần là chính mình.</h2>
            <p>
              Chọn một bộ, chuyền điện thoại và lần lượt chọn Thật hoặc Thách. Luôn có thể bỏ qua khi bạn không thoải mái.
            </p>
          </div>
          <Link href="/cach-choi">
            Xem cách chơi
            <ArrowRight size={17} />
          </Link>
        </section>
        <section className="home-faq">
          <h2>Một chút trước khi chơi</h2>
          {faq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </main>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': siteUrl + '#website',
              name: 'Thật hay Thách',
              url: siteUrl,
              inLanguage: 'vi',
            },
            {
              '@type': 'FAQPage',
              inLanguage: 'vi',
              mainEntity: faq.map(([q, a]) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            },
          ],
        }}
      />
    </SiteShell>
  );
}
