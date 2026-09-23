import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { pageMetadata } from '@/lib/seo';
import { localePath } from '@/lib/i18n';
import { pageLocale, copy } from '@/lib/i18n/pages';
const pages: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  'lien-he': {
    title: 'Hỗ trợ cuộc vui',
    sections: [
      {
        heading: 'Đã chuyển khoản nhưng chưa mở khóa?',
        text: 'Quay về trang thanh toán và chọn Kiểm tra lại. Giữ mã đơn, thời điểm chuyển, số tiền và mã giao dịch ngân hàng. Đừng chuyển thêm tiền khi đơn đầu tiên chưa được kiểm tra.',
      },
      {
        heading: 'Mất quyền chơi trên thiết bị mới?',
        text: 'Vào Bộ đã mua và nhập mã khôi phục được cấp sau thanh toán. Không gửi mã này công khai vì người có mã có thể mở lại bộ của bạn.',
      },
      {
        heading: 'Kênh hỗ trợ',
        text: process.env.NEXT_PUBLIC_SUPPORT_EMAIL
          ? `Liên hệ: ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}. Gửi mã đơn và mô tả sự cố; không gửi mật khẩu hoặc OTP ngân hàng.`
          : 'Bản phát triển chưa thiết lập kênh hỗ trợ và chưa sẵn sàng nhận thanh toán thật. Chủ ứng dụng cần bổ sung thông tin liên hệ trước khi mở bán.',
      },
    ],
  },
  'chinh-sach-thanh-toan': {
    title: 'Thông tin thanh toán',
    sections: [
      {
        heading: 'Mua một bộ, chơi nhiều lần',
        text: 'Mỗi lần mua mở khóa một bộ premium và các cập nhật của cùng bộ. Quyền chơi có hiệu lực 7 ngày từ khi thanh toán được xác nhận; hết hạn cần mua lại. Bộ mới khác không tự được bao gồm. Giá được hiển thị và xác nhận trước khi tạo đơn.',
      },
      {
        heading: 'Xác nhận chuyển khoản',
        text: 'Chuyển đúng số tiền và nội dung trên đơn. Hệ thống chỉ mở khóa sau khi ghi nhận thanh toán qua SePay. Nếu đã chuyển nhưng chưa mở khóa, hãy kiểm tra lại trạng thái; không chuyển lại ngay.',
      },
      {
        heading: 'Giữ mã khôi phục',
        text: 'Sau khi mua, lưu mã khôi phục để dùng khi đổi trình duyệt hoặc thiết bị. Không cần tạo tài khoản. Mã khôi phục là quyền truy cập bộ đã mua, vì vậy chỉ chia sẻ khi bạn chủ động muốn làm điều đó.',
      },
      {
        heading: 'Bản chạy thử',
        text: 'Thanh toán chỉ hoạt động sau khi chủ ứng dụng cấu hình ngân hàng, SePay, dữ liệu sản phẩm và kênh hỗ trợ. Không phát sinh thanh toán khi hệ thống chưa sẵn sàng.',
      },
    ],
  },
  'quyen-rieng-tu': {
    title: 'Quyền riêng tư',
    sections: [
      {
        heading: 'Tên nhóm và câu hỏi AI',
        text: 'Nhóm chơi thường và tên hoặc biệt danh được lưu trên trình duyệt. Khi bạn bấm tạo bộ AI, tên nhóm, thành viên và mood được gửi đến Vercel AI Gateway và nhà cung cấp mô hình để tạo nội dung; đầu vào và bộ câu hỏi được lưu riêng trong database theo phiên khách. Link bộ riêng không cấp quyền cho thiết bị khác. Xóa dữ liệu trình duyệt không tự xóa bản đã lưu trên server. Không thu câu trả lời của thành viên.',
      },
      {
        heading: 'Không thu câu trả lời',
        text: 'Ứng dụng không yêu cầu bạn nhập hoặc gửi câu trả lời Thật hay Thách. Tiến độ ván và nội dung đã tải được lưu trên trình duyệt của bạn.',
      },
      {
        heading: 'Dữ liệu khi mua bộ',
        text: 'Khi thanh toán được kích hoạt, hệ thống dùng cookie khách để liên kết đơn hàng và lưu trạng thái giao dịch, số tiền, mã giao dịch và quyền mua. Không yêu cầu tài khoản người chơi.',
      },
      {
        heading: 'Dữ liệu trên thiết bị',
        text: 'Xóa dữ liệu website sẽ xóa tiến độ và bộ offline. Quyền mua có thể khôi phục bằng mã đã lưu. Chế độ duyệt riêng tư có thể không giữ dữ liệu khi đóng trình duyệt.',
      },
      {
        heading: 'Thống kê',
        text: 'Bản này chưa gắn dịch vụ theo dõi quảng cáo hay công cụ analytics bên thứ ba. Không gửi mã khôi phục hoặc câu trả lời của người chơi tới hệ thống thống kê.',
      },
    ],
  },
};

const english: typeof pages = {
  'lien-he': {
    title: 'Help and contact',
    sections: [
      {
        heading: 'Transferred money but the pack is still locked?',
        text: 'Return to checkout and select Check again. Keep your order code, transfer time, amount, and bank transaction reference. Do not send another payment before the first one has been checked.',
      },
      {
        heading: 'Lost access on a new device?',
        text: 'Open Purchased packs and enter the recovery code issued after payment. Keep this code private: anyone who has it can restore access to your pack.',
      },
      {
        heading: 'Support',
        text: process.env.NEXT_PUBLIC_SUPPORT_EMAIL
          ? `Contact: ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}. Include your order code and a description of the issue. Do not send passwords or banking one-time codes.`
          : 'Support contact details are not configured for this development version, which is not ready to accept real payments. The app owner must provide contact information before sales begin.',
      },
    ],
  },
  'chinh-sach-thanh-toan': {
    title: 'Payment information',
    sections: [
      {
        heading: 'Buy a pack and play again',
        text: 'Each purchase unlocks one premium pack and updates to that same pack. Access lasts 7 days from payment confirmation; purchase again after expiry. Other new packs are not included automatically. The price is displayed and confirmed before an order is created.',
      },
      {
        heading: 'Bank transfer confirmation',
        text: 'Transfer the exact amount with the payment reference shown on the order. Access unlocks only after payment is recorded through SePay. If you have paid but the pack remains locked, check the order status instead of paying again immediately. Prices are in Vietnamese dong (VND); an English interface does not change the payment currency or bank transfer method.',
      },
      {
        heading: 'Keep your recovery code',
        text: 'After buying, save your recovery code to use in another browser or device. No player account is required. The code grants access to your purchases, so share it only when you intend to grant that access.',
      },
      {
        heading: 'Payment availability',
        text: 'Payments are available only after the app owner configures the bank, SePay, product data, and support channel. No payment is created while the system is not ready.',
      },
    ],
  },
  'quyen-rieng-tu': {
    title: 'Privacy',
    sections: [
      {
        heading: 'Group names and AI question packs',
        text: 'Regular groups and player names or nicknames are stored in your browser. When you create an AI pack, the group name, members, and mood are sent to Vercel AI Gateway and the model provider to generate content. The input and generated pack are stored privately in a database linked to your guest session. A private pack link does not grant access on another device. Clearing browser data does not delete the server copy. Player answers are not collected.',
      },
      {
        heading: 'Your answers are not collected',
        text: 'The app does not ask you to enter or submit Truth or Dare answers. Round progress and downloaded content are stored in your browser.',
      },
      {
        heading: 'Purchase data',
        text: 'When payments are enabled, the service uses a guest cookie to associate orders and stores transaction status, amount, transaction reference, and purchase access. No player account is required.',
      },
      {
        heading: 'Data on your device',
        text: 'Clearing website data removes game progress and offline packs. Purchases can be recovered using your saved code. Private browsing may discard data when you close the browser.',
      },
      {
        heading: 'Analytics',
        text: 'This version does not include advertising trackers or third-party analytics. Recovery codes and player answers are not sent to an analytics system.',
      },
    ],
  },
};
type Props = { params: Promise<{ info: string; locale: string }> };
export async function generateMetadata({ params }: Props) {
  const { info } = await params;
  const locale = await pageLocale(params);
  const p = (locale === 'en' ? english : pages)[info];
  return p ? pageMetadata(p.title, p.sections[0].text, `/vi/${info}`, locale) : {};
}
export default async function Info({ params }: Props) {
  const { info } = await params;
  const locale = await pageLocale(params);
  const p = (locale === 'en' ? english : pages)[info];
  if (!p) notFound();
  return (
    <SiteShell>
      <main id="main" className="page-width article-page">
        <Link className="back-link" href={localePath(locale, '/vi')}>
          {copy(locale, '← Trang chủ', '← Home')}
        </Link>
        <h1>{p.title}</h1>
        {p.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            <p>{s.text}</p>
          </section>
        ))}
      </main>
    </SiteShell>
  );
}
