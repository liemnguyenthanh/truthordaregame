# Quản trị bộ câu hỏi

Mở `/admin`, đăng nhập bằng `ADMIN_PASSWORD` trong biến môi trường server (ít nhất 16 ký tự). Không dùng tiền tố `NEXT_PUBLIC_`. Phiên cookie HttpOnly/SameSite Strict có hiệu lực 8 giờ; đổi mật khẩu sẽ vô hiệu hóa các phiên cũ. Đăng nhập bị giới hạn 10 lượt/phút trên toàn hệ thống. Mật khẩu local đã được tạo trong `.env`; đặt biến này riêng trên nơi deploy.

## Thêm bộ

1. Chọn **Tạo bộ mới**, nhập tên, mã bộ không dấu, mô tả, danh mục, số người chơi và độ tuổi.
2. Chọn miễn phí hoặc trả phí; nhập giá VND nếu thu phí.
3. **Nhập JSON** từ file hoặc dán nội dung, hoặc **Thêm câu hỏi** trực tiếp.
4. Chọn **Bản nháp** hoặc **Xuất bản**, bấm **Lưu bộ**.

Mỗi bộ cần ít nhất một câu Thật và một câu Thách. Bộ trả phí cần ít nhất 5 câu mỗi loại; 4 câu đầu mỗi loại dành cho chơi thử. Số câu, phiên bản nội dung, liên kết tải và thông tin bán hàng được tạo tự động. Mã bộ và đường dẫn không đổi sau lần lưu đầu. Giữ ID câu hỏi khi chỉnh câu cũ để giữ lịch sử chơi thử; dùng ID mới cho câu mới.

JSON nhận mảng hoặc object có `questions` (tương thích file cũ):

```json
{
  "questions": [
    { "id": "q-1", "type": "truth", "text": "Điều gì khiến bạn vui hôm nay?" },
    { "id": "q-2", "type": "dare", "text": "Hát một câu bạn thích." }
  ]
}
```

ID được sinh nếu thiếu. Nội dung trống, ID trùng, sai loại, hơn 2.000 câu hoặc request/file hơn 2 MB bị từ chối. Bản nháp vẫn phải có nội dung hợp lệ. Lưu bản nháp cho bộ đang xuất bản sẽ ẩn bộ và dừng bán; nội dung đã tải offline vẫn tồn tại trên thiết bị.

## Lưu trữ và vận hành

- `content_packs`: thông tin bộ, trạng thái, JSON câu hỏi (`jsonb`) và phiên bản hiện tại.
- `content_pack_versions`: bản nội dung đã xuất bản, bất biến, để URL cũ và ván đang chơi không nhận nhầm phiên bản.
- `products`: tự đồng bộ tên, giá và trạng thái bán trong cùng transaction. Thay giá tăng `price_version`; đơn cũ giữ snapshot.
- Tất cả bảng chỉ truy cập bằng service role phía server; API quản trị kiểm tra cookie và Origin. Không gửi mật khẩu hay service role xuống client.
- Nếu có hai phiên sửa cùng bộ, lần lưu với phiên bản cũ bị từ chối để tránh ghi đè.
- Website đọc Supabase ở thời điểm request, không cần build lại khi sửa nội dung. Các file `public/vi` là dữ liệu gốc để tham khảo và chế độ local không cấu hình Supabase; không còn là nguồn chính khi Supabase được cấu hình.
- Nội dung câu hỏi đã xuất bản vẫn có thể tải công khai như thiết kế offline trước đây; đây không phải hệ thống chống sao chép nội dung premium.

Migration `20260918091811_content_admin.sql` tạo bảng/RPC và nhập ba bộ hiện có. Trên project Supabase mới, chạy đầy đủ migrations trước khi khởi động. Nếu Supabase đã được cấu hình nhưng lỗi hoặc thiếu bảng, website báo lỗi thay vì âm thầm hiện lại dữ liệu tĩnh cũ.

Khi triển khai: đặt `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, áp dụng migration, build/deploy code. Không commit `.env`.
