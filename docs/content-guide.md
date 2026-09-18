> **Luồng quản trị hiện tại:** dùng `/admin` để thêm/sửa bộ và nhập JSON. Khi Supabase đã được cấu hình, không cần sửa các file bên dưới. Xem [hướng dẫn quản trị](admin-guide.md). Phần còn lại mô tả dữ liệu gốc và chế độ local không có Supabase.

# Hướng dẫn sửa nội dung câu hỏi

Dự án hiện có **36 câu mẫu**, chia thành ba bộ để dễ thay bằng nội dung của bạn. Đây là dữ liệu mẫu, không phải thư viện nội dung hoàn chỉnh.

## Các file cần biết

| File                                           | Vai trò                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `public/vi/categories.json`                    | Danh mục Bạn bè, Cặp đôi và danh sách ID các bộ                   |
| `public/vi/packs.json`                         | Catalog bộ, tiêu đề, mô tả, số câu, giá tham khảo, đường dẫn JSON |
| `public/vi/questions/ban-be-khoi-dong.v1.json` | Bộ miễn phí `friends-free`                                        |
| `public/vi/questions/ban-be-gan-ket.v1.json`   | Bộ premium `friends-premium`                                      |
| `public/vi/questions/hen-ho.v1.json`           | Bộ premium `couples-premium`                                      |

File trong `public/vi/` được truy cập bằng URL `/vi/…`, **không có `/public`**. Mỗi bộ có một JSON riêng chứa cả Thật và Thách; không ghép mọi câu vào catalog.

## Sửa một bộ đã phát hành

1. Sao chép file hiện tại sang version mới, ví dụ `ban-be-gan-ket.v1.json` → `ban-be-gan-ket.v2.json`. **Giữ nguyên file v1** để trình duyệt/cache và bản deploy cũ vẫn có thể tải. Không ghi đè nội dung tại URL đã được cache lâu.
2. Trong file mới, đổi `contentVersion` từ `"1"` thành `"2"`; giữ `schemaVersion: 1`, `packId` và `locale: "vi"`.
3. Sửa/thêm câu trong `questions`. Mỗi câu có đúng loại `truth` hoặc `dare`, ID duy nhất trong bộ, nội dung không rỗng. Giữ ID khi chỉ sửa cách diễn đạt của cùng một câu; cấp ID mới nếu là câu mới hoàn toàn. Không tái sử dụng ID đã xóa cho ý khác.
4. Premium giữ `trialQuestionIds` gồm đúng **8 ID có tồn tại: 4 Thật + 4 Thách**. Đây là tập preview cố định; không thay toàn bộ mỗi phiên. Bộ miễn phí dùng mảng rỗng `[]`.
5. Trong `packs.json`, tìm đúng `id` và cập nhật `questionFile` sang `/vi/questions/ban-be-gan-ket.v2.json`, `contentVersion` sang `"2"`. Cập nhật `truthCount`, `dareCount`, `questionCount` theo nội dung thực; `questionCount = truthCount + dareCount`. `trialCount` là 8 với premium, 0 với free.
6. Đổi `contentVersion` cấp catalog, ví dụ `2026-09-17.1` → `2026-09-18.1`. Nếu sửa danh mục, tăng version của `categories.json` tương tự. Giữ `id` và slug ổn định để không mất quyền mua và liên kết.
7. Chạy các lệnh kiểm tra bên dưới, kiểm tra preview và deploy toàn bộ thay đổi cùng nhau. Không xóa bản JSON cũ trong lần cập nhật này.

Mẫu một câu:

```json
{
  "id": "t07",
  "type": "truth",
  "text": "Điều nhỏ bé nào khiến bạn vui hôm nay?"
}
```

Mã hiện tại phát hiện thay đổi `contentVersion` khi mở lại bộ và khởi tạo ván mới, giữ lịch sử trial của các ID còn tồn tại. Một ván đang mở tiếp tục dùng dữ liệu đã tải. Không hứa chuyển tiến độ đầy đủ giữa hai phiên bản có nội dung khác nhau.

## Thêm bộ mới

- Tạo JSON version đầu `public/vi/questions/<slug>.v1.json` với `schemaVersion`, `packId`, `locale`, `contentVersion`, `trialQuestionIds`, `questions` giống cấu trúc các bộ mẫu.
- Thêm entry vào `packs.json`; dùng `id`, `slug`, `questionFile` duy nhất. `published: true` đưa bộ vào trang build. Giá trị `color` là `purple`, `pink` hoặc `orange`; `categoryIds` phải tồn tại trong catalog danh mục.
- Thêm ID bộ vào `packIds` của từng danh mục liên quan. Liên kết phải đúng cả hai chiều.
- Free: `tier: "free"`, `productId: null`, `priceHintVnd: 0`, `trialCount: 0`.
- Premium: `tier: "premium"`, `productId` riêng, `priceHintVnd` là số nguyên VND và trial 8 câu. Tạo/cấu hình sản phẩm tương ứng trong Supabase theo hướng dẫn thanh toán. Chỉ sửa JSON **không** tạo sản phẩm bán được trên backend.
- Nhãn tuổi, số người và mô tả phải phù hợp nội dung. Hướng tới câu ngắn dễ đọc, tôn trọng quyền bỏ qua và đồng thuận.

## Đổi giá

Giá thật do bảng `products` trong Supabase quyết định; `priceHintVnd` chỉ là giá tham khảo trên trang tĩnh. Cập nhật nguồn giá backend và catalog, sau đó build lại thông tin giới thiệu. Không đổi `packId` hoặc `productId` chỉ để đổi giá; người đã mua giữ quyền cùng bộ. Đơn đang tồn tại giữ snapshot giá theo quy tắc backend.

## Kiểm tra trước khi phát hành

Từ thư mục gốc dự án:

```sh
npx tsx scripts/validate-content.ts
npm test
npm run build
```

Validator kiểm tra ID, số câu, version, đường dẫn, liên kết category/pack và trial 4/4. `npm run build` cũng tự chạy validator trước Next.js. Test logic game dùng fixture riêng nên có thể thay số lượng câu thực mà không phải sửa test game.

Sau build, mở preview để kiểm tra câu dài trên điện thoại, chọn liên tục một loại, xem hết trial và xác nhận câu thứ 8 vẫn đọc được. JSON premium được tải đầy đủ theo quyết định sản phẩm; cơ chế trial là giới hạn UX phía frontend.
