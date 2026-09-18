# Thiết lập thanh toán

## Trạng thái Supabase — 2026-09-18

Project `spgaczspjwuqfkxbrnai` đã kết nối bằng cấu hình `.env` và kiểm chứng đọc products qua Supabase Data API. Đã áp dụng migrations `20260918065848_commerce`, `20260918065856_ai_generations` và `20260918070011_restrict_rls_auto_enable`; tên file local khớp lịch sử remote.

Đã chạy thành công `supabase/tests/commerce.sql` và `supabase/tests/ai-generations.sql` trên instance này, rollback dữ liệu thử. Có 10 bảng bật RLS và 5 RPC nghiệp vụ chỉ cho server gọi. Đã thu hồi quyền gọi public của helper `rls_auto_enable`; security advisor chỉ còn thông báo INFO về RLS không có policy, phù hợp thiết kế chỉ truy cập qua server.

Không có Supabase Edge Functions trong kiến trúc hiện tại: các endpoint nằm trong Next.js `app/api` và được triển khai cùng website. Kiểm tra này chưa xác nhận website production, credentials SePay, AI Gateway hay giao dịch ngân hàng thật. `.env` hiện còn thiếu các giá trị cấu hình thanh toán và AI Gateway.

Mã nguồn dùng Next.js runtime API + Supabase Postgres. Không dùng Supabase Auth. Trang nội dung vẫn SSG; không đặt `output: export`.

## Bật dịch vụ

1. Tạo Supabase, chạy `supabase/migrations/20260918065848_commerce.sql` qua SQL Editor hoặc Supabase CLI. Migration chạy một lần; bảng có RLS, không có policy public. Browser không nhận service-role key.
2. Sao chép `.env.example` thành `.env.local`. Điền URL/service key. Sinh `RECOVERY_ENCRYPTION_KEY` bằng `openssl rand -hex 32`; giữ ổn định, sao lưu an toàn. Đổi/mất key sẽ làm mất khả năng hiển thị mã đã mã hóa (hash vẫn dùng khôi phục được).
3. Điền số tài khoản, tên chủ tài khoản và tên gateway ngân hàng chính xác như payload SePay. Kiểm tra URL QR sinh ra đúng ngân hàng trước mở bán.
4. Tạo webhook SePay trỏ HTTPS `/api/webhooks/sepay`, loại tiền vào, bảo mật **API Key** với cùng `SEPAY_WEBHOOK_API_KEY`. Header là `Authorization: Apikey …`. Cấu hình mã thanh toán tiền tố `TOD`, hậu tố min = max = **10**, loại **Số và chữ** (server sinh 10 ký tự hex A–F/0–9). Server cũng tìm mã đầy đủ trong `content` nếu `code` rỗng. Không bật bộ lọc làm bỏ giao dịch sai mã nếu muốn lưu unmatched.
5. Đặt env tương ứng trên Vercel rồi deploy. `NEXT_PUBLIC_SITE_URL` phải là domain thật. Không cấu hình xong thì API trả 503 tiếng Việt; không có chế độ tự xác nhận paid.

Nguồn chính thức: [xác thực](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc), [payload và retry](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook), [QR SePay](https://sepay.vn/lap-trinh-cong-thanh-toan.html).

## Quy tắc đã cài

- Giá chỉ lấy từ `products`. Đổi `price_vnd`, tăng `price_version`; đơn cũ giữ snapshot.
- Cookie guest ngẫu nhiên 256-bit, HttpOnly, SameSite Lax, Secure ở production; DB chỉ giữ SHA-256, thời hạn một năm.
- Cùng guest/idempotency key trả cùng đơn; key khác tái dùng pending cùng bộ trong 15 phút; key dùng cho bộ khác trả 409.
- POST browser cần Origin cùng site. Không gọi checkout bằng cross-origin client.
- Webhook có khóa unique transaction ID. `apply_payment` commit event, order, purchase, entitlement và audit trong cùng transaction. DB lỗi sẽ rollback để retry không mắc kẹt.
- Đúng tài khoản, gateway, tiền vào, đúng số tiền snapshot và mã đơn mới cấp quyền. Giờ giao dịch được đọc là Asia/Ho_Chi_Minh. Chấp nhận từ giây tạo đơn (timestamp ngân hàng chính xác đến giây) đến 24h sau tạo. Không dựa thời điểm nhận webhook; không chấp nhận giờ tương lai >5 phút.
- QR hết hạn hiển thị sau 15 phút nhưng giao dịch trong cửa sổ 24h vẫn được xác nhận. Giao dịch sai tiền/muộn đưa `review_required`; sai tài khoản hoặc unmatched được lưu event, không cấp quyền. Không cộng các lần trả thiếu.
- Mã khôi phục 128-bit lưu SHA-256 + AES-256-GCM ciphertext; chỉ chủ session nhận mã. Khôi phục thêm quyền từ cùng purchase, không tạo doanh thu.
- API no-store. Rate limit chia sẻ DB theo phút: session 30/IP, tạo đơn 15/guest, khôi phục 8/guest và 20/IP. Sau deploy, xác minh header IP tin cậy do Vercel cấp; reverse proxy khác cần cấu hình tương ứng. Dọn `rate_limits` bucket cũ và session hết hạn bằng lịch nội bộ theo nhu cầu.

## Nghiệm thu cần môi trường Supabase/SePay thật

Chạy `npm test` cho validation. Kiểm thử SQL tích hợp vẫn cần Supabase thật: gửi song song cùng event → một purchase; làm lỗi ghi entitlement → event rollback, retry thành công; hai đơn cùng pack cùng trả → một quyền và event review; sửa giá client; đọc UUID đơn thiết bị khác; khôi phục thiết bị mới; mua khi mất mạng; sai tiền/tài khoản/mã; mốc 15 phút/24h; retry webhook đến muộn.

Đã kiểm chứng RPC bằng SQL trên instance Supabase của chủ dự án; chưa thực hiện giao dịch ngân hàng thật. Trước mở bán, chủ dự án thực hiện giao dịch giá nhỏ đã thống nhất, đối chiếu tiền vào → paid → quyền → mã → khôi phục. Không deploy như một tích hợp đã nghiệm thu ngân hàng.

## Đối soát và hoàn tiền

Đã có endpoint đối soát `GET /api/internal/reconcile`, chưa tự tạo lịch cron. Theo dõi webhook dashboard và `payment_events` trạng thái khác `paid`/`duplicate`, đối chiếu tài khoản ngân hàng, replay sự kiện thật từ SePay khi lỗi. Không tự đánh dấu paid bằng frontend. Cần thêm scheduler/API đối soát trước khi yêu cầu SLA tự động đầy đủ.

Hoàn tiền là thao tác quản trị, không có API public: sau khi người vận hành hoàn tiền thực tế, trong một transaction cập nhật `purchases.status='refunded'`, `orders.status='refunded'`, đặt `entitlements.revoked_at` cho mọi grant của purchase, và ghi `audit_events.kind='refund'`. Không xóa chứng từ. Cache quyền offline có thể còn đến lần đồng bộ theo trade-off sản phẩm.

Bổ sung email/kênh hỗ trợ thật và chính sách hoàn tiền trước mở bán. Không lưu raw webhook có thông tin ngân hàng ngoài các trường đối soát tối thiểu trong schema.

### Chạy đối soát

Điền `CRON_SECRET` ngẫu nhiên độc lập và `SEPAY_API_TOKEN` cho **User API v1**. Endpoint nội bộ yêu cầu `Authorization: Bearer <CRON_SECRET>`; thiếu cấu hình trả 503, sai credential trả 401. Không đưa secret vào URL hoặc frontend. Gọi bằng scheduler nội bộ mỗi 15–30 phút khi gói hosting cho phép, hoặc công cụ HTTP quản trị. Chưa khai báo Vercel cron vì chưa biết gói triển khai.

Mặc định mỗi lần lấy lại 48 giờ gần nhất; có thể truyền `from` và `to` ISO 8601 có timezone, tối đa 72 giờ/lần, để backfill sau downtime dài. Cửa sổ chồng lấn và transaction ID unique chống trùng. Sau sự cố quá 48 giờ phải backfill các khoảng thiếu; không có checkpoint tự lưu. Token này khác API Key webhook.

Dùng API v1 vì ID số khớp webhook. V2 dùng UUID và không được thay endpoint tùy ý vì sẽ làm lệch khóa chống trùng. V1 không có page/offset; adapter chia nhỏ cửa sổ thời gian khi đạt 5.000 hàng, overlap biên inclusive và loại trùng. Tối đa 15 request, cách nhau ít nhất 400ms, tối đa xử lý 300 giao dịch/lần. Khi đầy một giây hoặc vượt budget, trả lỗi để quản trị gọi khoảng nhỏ hơn; không báo thành công nếu có khả năng bỏ sót. Nếu runtime ngắt sau commit một phần, chạy lại cùng cửa sổ an toàn.

Mọi giao dịch đối soát đi qua cùng parser, kiểm tra tài khoản/giá/thời gian và RPC `apply_payment` như webhook; không tin trạng thái frontend. Response chỉ chứa tổng số và trạng thái, không chứa raw ngân hàng. Source: [SePay API v1](https://developer.sepay.vn/vi/sepay-api/v1/api-giao-dich). Adapter và chia trang có unit tests; cần test API token thật trước vận hành. Chạy `supabase/tests/commerce.sql` trên DB test sau migration để kiểm tra RPC; script rollback toàn bộ dữ liệu test.

### Bảo trì database

`audit_events.id` dùng identity sequence. Migration thu hồi quyền public/anon/authenticated và cấp `USAGE, SELECT` trên riêng `audit_events_id_seq` cho `service_role`; các RPC chạy SECURITY DEFINER dưới migration owner cũng có quyền sinh identity. Không cấp toàn bộ sequence schema cho browser.

`rate_limits` tăng một hàng mỗi guest/IP scope và được tái sử dụng theo phút; để giới hạn dung lượng, chạy định kỳ `delete from public.rate_limits where bucket < now() - interval '1 day';`. Có index trên `bucket` cho cleanup. Không xóa guest có orders/purchases vì FK bảo vệ chứng từ; chỉ cân nhắc xóa guest hết hạn không tham chiếu sau khi xác định retention. Chỉ thao tác bằng quyền quản trị/server.

Mã thanh toán có unique DB constraint. Nếu ngẫu nhiên trùng, server sinh lại tối đa 4 lần; lỗi khác không bị retry mù. Cấu hình mẫu theo [SePay mã thanh toán](https://developer.sepay.vn/vi/sepay-webhooks/cau-hinh-ma-thanh-toan). Đối soát không lọc theo `code`, nên giao dịch có `code=null` vẫn được kiểm tra qua nội dung.

### Kiểm thử PostgreSQL nhúng không cần credentials

Đã chạy migration và assertions thực tế bằng PGlite (PostgreSQL WASM), bao gồm gọi dưới `service_role`, đơn idempotent, webhook lặp, khôi phục, tiền sai, fault injection ở entitlement rồi retry, rate limit và quyền RLS/RPC/sequence. Cách chạy lại (dependency nằm ngoài project):

```sh
npm install --prefix /tmp/tod-db-verify --no-audit --no-fund @electric-sql/pglite
node supabase/tests/verify-embedded.mjs
```

Không tạo dịch vụ hoặc thay package.json. Database hoàn toàn trong bộ nhớ. PGlite xác minh PL/pgSQL và transaction rollback nhưng không thay thế Supabase PostgREST, multi-connection concurrency, config provider hay giao dịch SePay thật. Kiểm thử chạy nhiều request song song vẫn cần Supabase staging.
