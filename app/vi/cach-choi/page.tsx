import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata(
  'Cách chơi Thật hay Thách',
  'Luật chơi Thật hay Thách đơn giản cho nhóm bạn và cặp đôi: chọn bộ, chọn câu và tôn trọng quyền bỏ qua.',
  '/vi/cach-choi',
);
export default function Guide() {
  return (
    <SiteShell>
      <main id="main" className="page-width article-page">
        <Link className="back-link" href="/vi">
          ← Về chọn bộ
        </Link>
        <span className="eyebrow">CHỈ CẦN MỘT CHIẾC ĐIỆN THOẠI</span>
        <h1>
          Cùng chơi,
          <br />
          cùng hiểu nhau hơn.
        </h1>
        <p className="article-lead">
          Thật hay Thách là trò chơi trong đó mỗi người chọn trả lời một câu hỏi thật lòng hoặc thực
          hiện một thử thách vui. Có thể chơi từ hai người, không cần tính điểm.
        </p>
        <ol className="guide-steps">
          <li>
            <span>01</span>
            <div>
              <h2>Chọn đúng không khí</h2>
              <p>
                Chọn bộ dành cho bạn bè hoặc cặp đôi. Bộ miễn phí mở tất cả câu; bộ premium cho thử
                8 câu trước khi quyết định mua.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h2>Thật hay Thách?</h2>
              <p>
                Chuyền điện thoại đến người tiếp theo. Chọn “Thật” để trả lời, hoặc “Thách” để thử
                một điều vui. Mỗi lần bấm sẽ có một câu mới.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h2>Thoải mái mới là vui</h2>
              <p>
                Không ai bắt buộc phải trả lời hoặc làm thử thách. Bấm “Bỏ qua” bất cứ lúc nào.
                Không gây áp lực và không cần chứng minh mình can đảm.
              </p>
            </div>
          </li>
        </ol>
        <h2>Khi hết câu hỏi thì sao?</h2>
        <p>
          Bạn có thể xáo trộn để chơi lại hoặc đổi bộ khác. Các câu không lặp trong cùng ván. Bộ đếm
          chỉ là số câu đã xem, không phải điểm số.
        </p>
        <h2>Có chơi offline được không?</h2>
        <p>
          Trong màn chơi, chọn lưu bộ để chơi offline. Khi có thông báo đã lưu, bạn có thể mở lại
          ứng dụng và bộ đó khi mất mạng. Thanh toán và khôi phục vẫn cần kết nối.
        </p>
        <a href="/vi/choi/ban-be-khoi-dong" className="button button-primary">
          Thử một ván ngay →
        </a>
        <p className="editorial-note">Biên tập bởi Thật hay Thách · Cập nhật 17/09/2026</p>
      </main>
    </SiteShell>
  );
}
