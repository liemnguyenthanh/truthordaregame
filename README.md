# Thật hay Thách

Next.js App Router + TypeScript, các trang nội dung/game SSG, JSON trên CDN, Supabase commerce, SePay, PWA. Không tài khoản người chơi. 3 bộ mẫu × 12 câu; premium thử 8 câu (4 Thật + 4 Thách).

## Chạy local

Yêu cầu Node.js 22+.

```sh
npm ci
npm run dev
```

Mở `http://localhost:3000/vi`. Free và trial hoạt động ngay khi chưa có backend. Thanh toán sẽ báo chưa sẵn sàng nếu thiếu cấu hình, không có nút giả xác nhận trả tiền.

Kiểm tra bản production/PWA:

```sh
npm run build
npm run start
```

Service worker chỉ được đăng ký ở production để không cache file khi phát triển. Trong màn chơi chọn **Lưu bộ để chơi offline**; đợi thông báo đã lưu rồi mới ngắt mạng. PWA cần HTTPS (localhost là ngoại lệ khi phát triển).

## Cấu hình thanh toán

Sao chép `.env.example` sang `.env.local`, điền biến tương ứng. Không commit file thật.

1. Tạo Supabase, chạy `supabase/migrations/001_commerce.sql`.
2. Cấu hình ngân hàng, webhook SePay API Key, recovery encryption key và mã thanh toán tiền tố `TOD` + 10 ký tự hex.
3. Đặt domain thật vào `NEXT_PUBLIC_SITE_URL` và kênh hỗ trợ `NEXT_PUBLIC_SUPPORT_EMAIL` trước build production.
4. Cấu hình endpoint đối soát và scheduler theo gói hosting. Chưa tự tạo lịch cron hoặc hạ tầng cloud.
5. Kiểm tra transaction thật giá nhỏ, chính sách thanh toán/hoàn tiền và nội dung trước mở bán.

Hướng dẫn chi tiết: [payment-setup.md](docs/payment-setup.md). Migration và API đã có; cần credentials thật để nghiệm thu Supabase/SePay end-to-end. Quyền premium chủ yếu khóa giao diện theo yêu cầu, JSON luôn public.

## Chơi nhóm và tạo bộ AI

**Chơi ngay** mở thẳng bộ miễn phí; **Tạo nhóm & chơi** cho nhập 2–8 tên, chia lượt và lưu tiến độ trên thiết bị. Nhóm dùng chung một màn hình, chưa phải phòng online.

Trang `/vi/tao-bo-ai` cho chọn nhóm và mood. Mỗi người có 2 Thật + 2 Thách liên kết với người khác. Mood 18+ yêu cầu xác nhận tuổi và dùng hướng tán tỉnh không tường minh. Mặc định thử nghiệm miễn phí 3 lần/guest/ngày; có thêm giới hạn IP và toàn hệ thống.

Để bật AI, chạy thêm migration `002_ai_generations.sql`, cấu hình Supabase và Vercel AI Gateway theo [ai-setup.md](docs/ai-setup.md). Chưa có credentials thì UI báo chưa sẵn sàng; không giả lập kết quả AI. Bộ riêng lưu trong DB và trình duyệt, có lịch sử và hỗ trợ lưu màn chơi offline. Xem [spec bổ sung](docs/group-ai-spec.md).

## Thay nội dung

- `public/vi/categories.json`: danh mục.
- `public/vi/packs.json`: catalog, mô tả, count và đường dẫn file.
- `public/vi/questions/*.v1.json`: mỗi bộ một file, gồm cả Thật và Thách.
- Sửa bộ bằng URL/version mới, giữ version cũ. `packId` và ID câu nên ổn định.
- Giá chính thức ở bảng Supabase `products`; `priceHintVnd` chỉ là giá tham khảo trước checkout.

Xem [content-guide.md](docs/content-guide.md) để thêm bộ và chạy validation. Chưa cần viết nhiều nội dung; hiện tổng cộng 36 câu minh họa.

## Kiểm tra

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Nếu có Chrome sẵn, đặt `CHROME_BIN` trỏ executable để bỏ bước tải Chromium. E2E tự dùng server production port 3000 hoặc dùng server đang chạy. API thanh toán trong bài kiểm tra mô phỏng được ghi rõ; không tương đương giao dịch ngân hàng thật.

## Triển khai Vercel

Import repository, chọn framework Next.js, build command `npm run build`, giữ output mặc định. **Không dùng `output: 'export'`** vì cần Route Handlers nhận webhook. Thêm các env từ `.env.example`; `NEXT_PUBLIC_*` cần redeploy khi đổi. Supabase service role và SePay secret chỉ là server env.

Đặt `NEXT_PUBLIC_SITE_URL=https://domain-cua-ban` trước build để canonical/sitemap đúng. Kiểm tra response headers production; preview có noindex. Cấu hình SePay webhook về `/api/webhooks/sepay`, đối soát bảo vệ bằng secret. App chưa được triển khai cloud trong lần xây dựng này.

## Tài liệu

- [Tasks và trạng thái](docs/tasks.md)
- [Spec](docs/truth-or-dare-spec.md)
- [Checklist SEO/GEO](docs/seo-geo-checklist.md)
- [Thay nội dung](docs/content-guide.md)
- [Thanh toán](docs/payment-setup.md)
- [Kết quả kiểm tra](docs/verification.md)

Phạm vi hiện tại: SSG, các trang category/pack, free/trial/game, checkout/restore, JSON versioned, PWA, sitemap/robots/canonical và structured data. Chưa tích hợp bên thứ ba cho analytics, chưa có CMS hay tài khoản, chưa có hình share OG riêng, chưa có bài hướng dẫn ngoài trang cách chơi. Danh sách bài SEO trong spec là lộ trình nội dung, không sinh trang rỗng.
