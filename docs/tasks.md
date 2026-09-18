# Tasks — Truth or Dare MVP

Các agent làm song song trên phần riêng; leader tích hợp và nghiệm thu.

- [x] Nền tảng Next.js / TypeScript / scripts (leader)
- [x] 3 bộ mẫu: 1 free 12 câu, 2 premium 12 câu/bộ, trial 8 câu (agent content)
- [x] Validation dữ liệu và luật rút câu không lặp (agent content)
- [x] Game, trial, paywall, checkout, restore responsive (agent UI)
- [x] Session khách, API orders, giá server, entitlement (agent backend)
- [x] SePay webhook idempotent, migration/RLS Supabase (agent backend)
- [x] Endpoint đối soát có xác thực và pipeline chung với webhook (agent backend)
- [x] Home/category/pack và nội dung SEO SSG (leader)
- [x] Styling theo ảnh, metadata/sitemap/robots (leader)
- [x] PWA install/offline/update (leader)
- [x] Build/typecheck/tests và browser flow mobile (leader)
- [x] README, env mẫu, hướng dẫn thay câu và kích hoạt thanh toán (leader)

Thanh toán production cần Supabase project, chạy migration, ngân hàng/SePay và secret. Không tạo giao dịch tiền thật trong lúc phát triển.

## Cần cấu hình trước khi mở bán

- [ ] Domain/Vercel project và env production.
- [ ] Supabase thật, migration và kiểm thử PostgREST/concurrency.
- [ ] Ngân hàng/SePay, webhook, giao dịch nghiệm thu giá nhỏ.
- [ ] Scheduler cho đối soát và quy trình hỗ trợ/hoàn tiền.
- [ ] Thay nội dung mẫu, kiểm tra chính sách/đơn vị liên hệ.

Kết quả kiểm thử local được ghi trong `verification.md`. Không đánh dấu các đầu việc hạ tầng/ngân hàng thật là hoàn tất chỉ vì code đã có.

## Bổ sung nhóm và AI — 17/09/2026

- [x] Leader: hợp đồng dữ liệu, trang SSG, entry points, PWA, tích hợp và nghiệm thu.
- [x] Agent game_ui: nhóm 2–8 người, lượt chơi, giữ trạng thái, game personalized.
- [x] Agent content: form mood/nhóm, lịch sử, trạng thái tạo và chơi bộ AI.
- [x] Agent backend: Gateway, structured output, Supabase reservation/quota/idempotency, API riêng tư.
- [x] Spec bổ sung và hướng dẫn cấu hình.
- [ ] Cấu hình credentials và kiểm tra model thật trên staging.
- [ ] Chốt giá/giới hạn AI và đánh giá nội dung thật trước mở công khai.
