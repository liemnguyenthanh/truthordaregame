# Nhóm chơi và bộ câu hỏi AI — bổ sung MVP

Ngày: 17/09/2026. Bổ sung theo yêu cầu mới, thay thế mục “tên người chơi để giai đoạn sau” của spec 1.0.

## 1. Chơi ngay / chơi nhóm

- CTA chính vẫn mở thẳng game. Không bắt khai báo tên hay tạo tài khoản.
- CTA phụ “Tạo nhóm & chơi” hoặc nút “Tạo nhóm” trong game mở form tại màn chơi.
- Một nhóm có tên và 2–8 thành viên. Tên/biệt danh mỗi người duy nhất (không phân biệt hoa thường), tối đa 30 ký tự.
- Nhóm lưu local trên thiết bị và có thể dùng lại giữa các bộ. Không phải phòng online, không mã mời, không đồng bộ nhiều máy.
- Tạo/chỉnh nhóm bắt đầu ván mới với thông báo rõ. Không thay đổi quyền mua hoặc tập trial.
- Câu đầu dành cho người đầu danh sách; mỗi lần rút câu mới thành công chuyển lần lượt sang người tiếp theo.
- Bỏ qua rút lại cho người hiện tại; hết câu/trial hoặc rút thất bại không làm nhảy lượt.
- Hiển thị tên người đang chơi và thứ tự nhóm. Reload giữ câu và người đang chơi.
- Có thể quay lại chơi không tên. Nhóm trong bộ AI cố định vì câu đã viết theo tên; muốn đổi thành viên thì tạo bộ mới.

## 2. Bộ câu hỏi AI

Luồng: nhập/chọn lại nhóm → chọn mood → xác nhận tuổi nếu mood 18+ → tạo bộ → chơi với lượt được gắn đúng tên.

Mood mặc định: Vui vẻ, Gắn kết, Quậy một chút, Táo bạo · 18+. Mood cuối dành cho người lớn đã đồng ý, theo hướng tán tỉnh và thân mật; không mặc định suy diễn quan hệ, xu hướng tính dục hoặc chuyện riêng chưa được người chơi cung cấp.

Mỗi thành viên có 2 câu Thật + 2 câu Thách: 4N câu, từ 8 đến 32 câu. Mỗi câu có người thực hiện và một người tương tác khác, không tự ghép với chính mình. Server xác định danh sách slot/người trước; AI viết nội dung cho các slot. Kết quả phải có đúng số slot và nhắc đúng hai tên được chỉ định. Không chấp nhận một danh sách câu hỏi chung chung rồi gắn tên tượng trưng ở header.

Ví dụ ý tưởng: “An, hãy nói với Bình một điều bạn trân trọng ở Bình.” Đây là ví dụ mô tả yêu cầu, không phải kết quả AI được giả lập trong ứng dụng.

## 3. Mặc định thương mại đang áp dụng

Trong lúc chờ chủ sản phẩm xác nhận, tính năng AI thử nghiệm miễn phí có giới hạn. Số lượt mặc định 3/guest/ngày, giới hạn theo IP và tổng hệ thống để kiểm soát chi phí; giá trị cấu hình ở server. Không tự trừ tiền hoặc mở đơn SePay cho tính năng AI. Bộ premium biên tập sẵn vẫn giữ luồng mua cũ.

Mỗi request có idempotency key; retry mạng dùng cùng key, không tự phát sinh lần gọi model mới. Yêu cầu mới có thể tiêu tốn một lượt kể cả khi provider lỗi, vì đã sử dụng tài nguyên; UI thông báo rõ. Cần cấu hình budget nhà cung cấp trước mở tính năng công khai.

## 4. Kiến trúc và dữ liệu

- Trang tạo và trang chơi AI là shell SSG/noindex: `/vi/tao-bo-ai`, `/vi/bo-ai?id=<uuid>`.
- `POST /api/generations`: xác thực session khách, validate input, reserve DB atomically, gọi Vercel AI Gateway qua AI SDK, validate structured output, lưu kết quả.
- `GET /api/generations/:id`: chỉ guest sở hữu đọc được. `GET /api/generations` trả lịch sử của guest.
- Tạo ID trước khi gọi model; lưu trạng thái pending/complete/failed, input, output, model, usage, thời gian và chi phí ước tính nếu có giá cấu hình.
- Pending trễ được chuyển sang failed theo hạn xử lý; tải lại dùng ID có sẵn để xem trạng thái.
- Supabase migration riêng nối guest đã có; RLS không mở dữ liệu nhóm cho anon/authenticated.
- Câu AI không nằm trong public JSON hay sitemap. Không sửa kiến trúc CDN của các bộ biên tập sẵn.
- Bản hoàn chỉnh được lưu thêm trong trình duyệt. Chỉ báo sẵn sàng offline sau khi lưu shell/assets; không cache API riêng tư bằng service worker.
- Không cần Supabase Auth; link có UUID không tự cấp quyền chia sẻ sang người khác.

## 5. Không cấu hình / lỗi

Tạo nhóm và chơi bộ có sẵn vẫn chạy khi không có AI hoặc database. Tạo bằng AI cần Supabase migration và thông tin Gateway. Khi chưa cấu hình, hiện thông báo AI chưa sẵn sàng; không trả câu mẫu rồi gọi đó là kết quả AI.

Không tự retry provider nhiều lần khi lỗi. Các trạng thái cần có: chưa nhập nhóm, tên trùng, thiếu xác nhận18+, đang tạo, mất mạng, hết lượt, provider không sẵn sàng, output sai, pending, failed, complete, dữ liệu trình duyệt không lưu được.

## 6. Nghiệm thu

- Chơi ngay không bị form nhóm chặn.
- Nhóm 3 người: câu 1/2/3/4 lần lượt A/B/C/A; skip giữ actor, refresh giữ actor.
- Trial và ownership không thay đổi khi tạo/chỉnh nhóm.
- AI input thiếu/dup tên, sai mood, thiếu18+ bị từ chối trước gọi model.
- Câu personalized luôn được hiển thị đúng actor; skip không chuyển sang câu của người khác.
- Output có đúng 4N slot, cân bằng Thật/Thách và actor/partner hợp lệ.
- Retry cùng key chỉ reserve một generation; giới hạn và một pending được enforce trong DB.
- API lịch sử và GET UUID không cho guest khác đọc.
- Noindex trang riêng, không đưa tên vào canonical/sitemap hoặc analytics.
- Mock provider tests phải được phân biệt với một lần tạo bằng model thật.
