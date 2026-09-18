# Bộ AI theo nhóm — cấu hình và vận hành

## Thiết lập

Chạy migration `20260918065848_commerce.sql` trước, sau đó `20260918065856_ai_generations.sql`. Đặt server env `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, và một trong hai `AI_GATEWAY_API_KEY` hoặc `VERCEL_OIDC_TOKEN` do Vercel runtime cấp. AI SDK Gateway mặc định hỗ trợ API key hoặc OIDC; không đưa token lên frontend và không lưu token ngắn hạn vào Git. Mặc định `AI_MODEL=openai/gpt-6-astra`, model ID đã kiểm tra trên danh sách Vercel Gateway trong ngày triển khai. Có thể thay model bằng env; cần thử structured output trước khi đưa vào sử dụng.

MVP chưa thu tiền người chơi cho lần tạo AI (`billing: free`), nhưng nhà vận hành vẫn trả phí model. Không liên kết lần tạo AI với đơn SePay hoặc pack premium tĩnh. Giới hạn mặc định mỗi ngày Việt Nam: 3 lần/guest, 6 lần/IP, 20 lần toàn ứng dụng. Chỉnh `AI_DAILY_LIMIT`, `AI_IP_DAILY_LIMIT`, `AI_GLOBAL_DAILY_LIMIT` để giới hạn ngân sách. Cả lần thất bại đều tính quota vì provider có thể đã tính phí. IP được băm; kiểm tra proxy/Vercel cung cấp header IP tin cậy trước mở public. Người cùng mạng có thể chia sẻ giới hạn IP.

Không có cả API key và OIDC thì API tạo/config trả 503 thông báo AI chưa cấu hình; lịch sử và lấy bộ đã lưu chỉ cần Supabase/cookie, vẫn hoạt động khi Gateway bị tắt hoặc đang đổi key; không tạo nội dung giả và không có live call trong kiểm thử đã thực hiện.

## API

- `GET /api/generations/config`: `{available, dailyLimit, billing: 'free'}`; không trả model secret hoặc quota nội bộ.
- Gọi `POST /api/session` để nhận cookie guest, sau đó `POST /api/generations` với `Idempotency-Key` ngẫu nhiên ổn định, body `{group, mood, adultsConfirmed}`. Cùng origin bắt buộc.
- POST trả `{generation}` gồm `id,status,group,mood,createdAt`, và `pack,questionSet` khi hoàn thành. Thường chờ model tối đa 45 giây; cùng key trả bản đã lưu, không gọi model lần nữa. Dùng key mới chỉ khi chủ động tạo lần mới.
- `GET /api/generations/:id` trả cùng object, chỉ guest sở hữu. `GET /api/generations` trả `{generations,limitPerDay}` (20 lần gần nhất).
- Nếu POST mất kết nối, mở lịch sử/poll ID hoặc gửi lại cùng key. Pending quá 90 giây chuyển failed lúc đọc hoặc reserve; không tự chạy lại model sau runtime crash.

## Nội dung và tính riêng tư

Server chuẩn hóa nhóm 2–8 người. Mỗi người đúng 4 slot: 2 Thật + 2 Thách; partner luân phiên trong nhóm, không tự ghép chính mình. Model chỉ điền văn bản. Server kiểm tra số lượng, ID slot duy nhất, tên người thực hiện và partner có trong từng câu, rồi ghép type/playerId/partnerId từ kế hoạch tin cậy.

Mood `friendly`, `deep`, `party`, `flirty`; flirty yêu cầu tất cả đã xác nhận 18+. Chỉ tán tỉnh không tường minh, đồng thuận, có quyền bỏ qua; không suy đoán xu hướng hoặc lịch sử thân mật. Tên được đưa vào JSON như dữ liệu, prompt hệ thống cấm làm theo chỉ dẫn nằm trong tên. Không bật tools, tìm kiếm hoặc tải URL. Kiểm tra cấu trúc không thay thế đánh giá chất lượng/ngữ nghĩa; cần đọc thử kết quả thật trước mở bán/tăng quota.

Bộ AI nằm trong bảng riêng có RLS, chỉ API dùng service role đọc/ghi; không ghi vào public JSON, sitemap hay cache CDN. Tên nhóm/thành viên và nội dung được gửi đến nhà cung cấp AI và lưu trong Supabase. Người dùng cần được thông báo điều này trước tạo. Không ghi raw lỗi/provider output vào log công khai. Mất cookie thì hiện chưa có mã khôi phục dành riêng cho bộ AI; mã khôi phục SePay chỉ áp dụng giao dịch premium.

## Độ tin cậy và chi phí

RPC `reserve_generation` giữ khóa giao dịch để kiểm tra quota chung/guest/IP và dành ID trước khi gọi AI. Một pending/guest, unique guest+key; retry cùng key không tạo LLM call trùng. Sau model success, chỉ ghi database được retry tối đa 3 lần (nghỉ 150ms/350ms), không gọi provider lại. Nếu response ghi bị mất nhưng commit thành công, lần đọc lại nhận bộ complete. Nếu cả 3 lần lưu đều lỗi, trả 503, giữ pending để người dùng kiểm tra lịch sử; không cố đổi kết quả hợp lệ thành failed. Outage kéo dài đến quá thời hạn pending vẫn có thể mất output chưa lưu dù provider đã tính phí; chưa có durable outbox/worker để khôi phục trường hợp đó.

AI SDK `generateText` + `Output.object(jsonSchema)` dùng Gateway; `maxRetries:0`, timeout45s, output tối đa8.000 tokens. Ghi model, duration, input/output/total tokens thực từ SDK; cost mặc định null. Chỉ tính `estimated_cost_usd` nếu đặt cả `AI_INPUT_USD_PER_MILLION` và `AI_OUTPUT_USD_PER_MILLION` bằng giá đã xác minh. Ước lượng này chưa phân biệt cached input/reasoning/provider adjustment, không thay invoice thực. Đổi model phải cập nhật hoặc xóa giá env.

Pending bị gián đoạn xử lý khi đọc/reserve, không có worker tự chạy ngầm. Chưa có tính năng xóa/history retention tự động; thiết lập retention và hỗ trợ xóa theo chính sách sản phẩm trước vận hành rộng. Giữ metadata quota nếu sau này xóa output để tránh reset giới hạn ngoài ý muốn.

## Kiểm thử

`npm test` gồm slot coverage, thiếu/trùng slot, tên partner, điều kiện mood và chi phí unknown. SQL nhúng thực:

```sh
npm install --prefix /tmp/tod-db-verify --no-audit --no-fund @electric-sql/pglite
node supabase/tests/verify-ai.mjs
```

Đã kiểm chứng migration + RPC reserve/replay/conflict, một pending, timeout, quota guest/IP/global và quyền riêng tư. PGlite không mô phỏng nhiều kết nối hay Supabase PostgREST. Chưa gọi model có phí hoặc kiểm thử credentials thật. Trước launch kiểm tra staging: retry đồng thời, owner khác, lỗi model/timeout, quota chuyển ngày, giá/usage thật và đọc toàn bộ câu được tạo cho các mood.
