# Kết quả nghiệm thu local — 17/09/2026

## Đã chạy thành công

| Phần             | Bằng chứng                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Production build | `npm run build` pass; trang home/category/pack/game/info prerender hoặc SSG; `/api/*` dynamic                                                                                                                      |
| TypeScript       | `npm run typecheck` pass                                                                                                                                                                                           |
| Unit/content     | `npm test`: 27/27 pass, tổng 36 câu mẫu hợp lệ                                                                                                                                                                     |
| SQL              | PGlite chạy migration và `supabase/tests/commerce.sql` pass                                                                                                                                                        |
| Browser          | 16/16 kịch bản Playwright đã pass (13 ở lượt tổng, 1 rerun sau sửa selector, 2 bổ sung offline/thiếu cấu hình); một selector alert được giới hạn vào main để tránh trùng Next route announcer rồi rerun thành công |
| UI               | Kiểm tra trực quan desktop 1440px và mobile 390px; test 320px không tràn ngang ở game/paywall/nhóm; kiểm tra trực quan trang AI tại 390px                                                                          |
| Runtime          | Không có page error/console error trong kiểm tra trực tiếp free game bằng agent-browser                                                                                                                            |

## Kịch bản browser

1. Free: rút câu, reload giữ đúng ID/count, hết 6 Thật rồi tiếp tục Thách, không lặp.
2. Premium: 4 Thật + 4 Thách; câu 8 còn đọc được; thao tác tiếp theo mở paywall và focus tiêu đề; chơi lại vẫn cùng tập preview.
3. Checkout thiếu env: thông báo chưa cấu hình, không hiện success hoặc QR thu tiền.
4. Game/paywall tại viewport 320px không tràn ngang.
5. **API mock riêng trong test:** QR → phản hồi paid → mã khôi phục → chơi tiếp có quyền. Không gọi SePay và không chuyển tiền.
6. HTML SSG có nội dung/canonical/JSON-LD; sitemap bỏ game/checkout; slug sai trả 404 thật.
7. Catalog cache ngắn, file câu immutable, API quyền mua private/no-store trên server local.
8. Lưu shell + bộ câu + assets, tắt mạng, reload, rút câu; mở trang mới offline vào thư viện rồi quay lại ván vẫn giữ tiến độ.

## SQL đã xác minh

Migration thực thi được; service role gọi RPC; idempotency tạo đơn và event duplicate; tiền sai đưa review; khôi phục cấp quyền; tạo lỗi khi insert entitlement thì toàn transaction rollback và retry xử lý được; anon/authenticated không đọc bảng/gọi RPC commerce; rate limit hoạt động. Phát hiện và sửa xung đột alias/biến PL/pgSQL khi kiểm thử.

PGlite là PostgreSQL nhúng, không mô phỏng đầy đủ nhiều connection đồng thời hay Supabase PostgREST. Cần chạy lại assertions và request concurrency trên staging Supabase.

## Chưa thể xác minh ở local

- Tiền vào ngân hàng → SePay webhook thật → Supabase thật → mở khóa. Thiếu credentials của chủ dự án.
- CDN HIT toàn cầu và headers được Vercel xử lý sau deploy; local chỉ chứng minh config/header origin.
- Cài PWA thực tế trên iPhone/Android, storage riêng giữa Safari và standalone.
- Core Web Vitals field p75, Search Console/index/ranking/GEO referral. Chưa deploy hoặc có traffic.
- Scheduler đối soát vận hành, rollback cloud và quy trình hỗ trợ/hoàn tiền thật.

## Ranh giới triển khai

MVP là code chạy local, backend sẵn cấu hình. Chưa publish lên Vercel, chưa tạo Supabase project, chưa thu tiền. Dữ liệu premium public theo quyết định sản phẩm. Nội dung SEO cơ bản hoàn thành; các bài hướng dẫn bổ sung, analytics bên thứ ba và ảnh social riêng để lại cho lần mở rộng.

## Bổ sung nhóm và AI

- Nhóm tùy chọn: 3 thành viên chia lượt, skip giữ actor, reload giữ trạng thái, sửa nhóm bắt đầu lại; tên trùng bị từ chối.
- 4 E2E API mock AI: tên/mood/xác nhận18+, chơi câu đúng actor và reload, retry cùng key qua reload, pending→complete, failed không tự gọi lại. Không gọi model thật.
- PGlite migration002: idempotency/conflict, một pending, timeout và quota guest/IP/global, quyền bảng riêng tư pass.
- Unit kiểm tra coverage slots/partner, output thiếu/trùng tên, mood18+, retry lưu DB và chi phí unknown.
- Hai trang AI SSG/noindex; API thiếu cấu hình trả503/private,no-store trung thực.
- Chưa xác minh model thật, chất lượng nội dung thực hoặc Vercel Gateway/Supabase end-to-end vì chưa có credentials.

- 2 E2E bổ sung pass: bộ AI mẫu được seed local, cache shell/service worker thật rồi reload và mở tab mới offline, vẫn chia đúng lượt An/Bình và không pageerror; API chưa cấu hình trả503 được hiển thị đúng, không tạo bộ giả.
