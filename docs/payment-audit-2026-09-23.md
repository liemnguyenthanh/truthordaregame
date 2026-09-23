# Kiểm thử thanh toán — 2026-09-23

Luồng chính PASS: frontend local `http://localhost:3000` → Next.js API → Edge Function đã deploy → Supabase database thật → frontend mở khóa. Dùng bộ đang bán `premium-18`, giá 30.000 VND. Webhook được mô phỏng bằng API Key hiện có; không chuyển tiền thật. Đã dọn order, payment event, purchase, entitlement, audit và guest thuộc bài test.

## Đã kiểm chứng

- Webhook GET → 405; sai API Key → 401; đúng key, payload sai → 400.
- UI tạo đơn thật và hiển thị QR khớp số tiền/mã TOD + 10 ký tự hex.
- Tạo lại đơn pending với key khác tái sử dụng cùng đơn; giá 1 VND gửi từ client bị bỏ qua.
- Guest khác đọc UUID đơn bị từ chối (404).
- Hai webhook giống nhau gửi đồng thời đều ACK, chỉ tạo một purchase.
- FE tự polling đến paid; mã recovery do Edge tạo được website giải mã.
- Chơi tiếp hiển thị đã mở khóa; restore trên guest mới trả 200 và cấp entitlement.
- Sai số tiền đưa đơn vào review_required, không tạo purchase.
- Không có browser runtime errors trong flow thành công; 56/56 unit tests pass.

## Còn thiếu / giới hạn

Cập nhật sau tối ưu checkout: mục 1 bên dưới đã được sửa. FE tiếp tục polling chậm cho `expired`/`review_required` trong cửa sổ 24 giờ và kiểm tra khi focus/online, đồng thời chặn request kiểm tra chồng nhau. Hai bài test mobile VI/EN (320px, offline → online → expired → paid) và bài test checkout → chơi tiếp đã pass. Các mục 2–4 vẫn còn hiệu lực.

1. **P2: thanh toán đến muộn cần thao tác tay.** Checkout chỉ polling và đăng ký focus/online khi `pending`. Sau 15 phút, API trả `expired`, FE dừng tự kiểm tra, nhưng database vẫn chấp nhận giao dịch hợp lệ trong 24 giờ. Người dùng phải bấm “Kiểm tra lại” hoặc tải lại trang. `review_required` được xử lý về paid cũng gặp hạn chế tương tự. Nên tiếp tục kiểm tra khi trở lại tab/online với trạng thái còn có thể chuyển sang paid.
2. **Chưa có đối soát dự phòng tự động.** Local thiếu `SEPAY_API_TOKEN`, `CRON_SECRET`; repository chưa cấu hình scheduler reconcile. Chưa kiểm chứng tự bù giao dịch nếu webhook bị bỏ lỡ.
3. **Premium chỉ khóa giao diện.** Request không cookie tới questionFile của `premium-18` trả 200 và đủ 200 câu. Đây là giới hạn thiết kế hiện có; cần thay đổi cách phân phối nội dung nếu muốn paywall bảo vệ ở backend, kể cả JSON tĩnh/cache/offline.
4. **Chưa nghiệm thu SePay/ngân hàng hoặc website production.** Cần một chuyển khoản thật để xác nhận ngân hàng → SePay → webhook, filter, thời gian gửi và retry thực tế.

## Ghi chú môi trường

- `friends-premium` cũ hiện là free/product inactive; bài test dùng catalog hiện hành.
- Browser truy cập `127.0.0.1:3000` đứng chờ và báo lỗi HMR WebSocket; cùng server qua `localhost:3000` chạy được. Chưa xác định nguyên nhân gốc; không kết luận production có lỗi này.
- Không sửa mã nguồn nghiệp vụ trong lượt audit.

## Flow

Chọn bộ → guest cookie → tạo order theo giá server + mã TOD → QR → chuyển khoản → SePay POST Edge Function → xác thực API Key/payload → RPC kiểm tra tài khoản/mã/tiền/thời gian/chống trùng → commit paid + purchase + entitlement → FE polling mỗi 4 giây khi pending và tab mở → mở khóa + mã khôi phục → chơi tiếp hoặc khôi phục ở thiết bị khác.
