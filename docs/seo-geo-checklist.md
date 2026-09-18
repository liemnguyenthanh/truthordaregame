# Checklist SEO + GEO — Truth or Dare PWA

Đi kèm `truth-or-dare-spec.md`, phiên bản 17/09/2026. Đây là checklist bàn giao và nghiệm thu, không phải tuyên bố website đã được triển khai hoặc audit.

## 1. Trước khi code

- [ ] Chốt domain production, brand, tiếng Việt và đường dẫn canonical.
- [ ] Lập danh sách intent: chơi ngay, chọn chủ đề, tìm mẫu câu, tìm luật chơi, hỏi về premium/khôi phục.
- [ ] Mỗi intent có trang đích phù hợp; không tạo URL cho từng tổ hợp filter nếu chưa có nội dung độc lập.
- [ ] Có mô tả riêng cho từng category/pack; count sinh từ nội dung thật.
- [ ] Xác định trang index/noindex theo sitemap trong spec.

## 2. Next.js và crawlability

- [ ] `generateStaticParams` tạo tất cả route nội dung đã publish; unknown slug có 404 đúng.
- [ ] HTML ban đầu chứa nội dung hữu ích, H1 và liên kết `<a href>`; không phụ thuộc click để crawler phát hiện.
- [ ] `generateMetadata` hoặc metadata tĩnh tạo title/description/canonical riêng.
- [ ] `metadataBase` là domain production; không để canonical trỏ preview.
- [ ] `lang=vi`; chỉ thêm hreflang khi có bản dịch thật và liên kết hai chiều.
- [ ] Sitemap chỉ chứa URL 200, canonical, indexable; lastmod là ngày sửa nội dung.
- [ ] Robots cho phép crawl trang nội dung; noindex được đặt trên checkout, restore và game shell.
- [ ] Không vừa disallow một URL vừa trông đợi crawler đọc meta noindex ở URL đó.
- [ ] Preview/staging có chặn index hoặc access protection; production không kế thừa chặn nhầm.
- [ ] Slug đổi có 301; các URL bộ cũ vẫn redirect đúng dù pack ID giữ nguyên.
- [ ] Bộ lọc/tracking params không tạo nội dung trùng được index.
- [ ] JSON có thể thêm X-Robots-Tag noindex; hiểu rằng đây không là cơ chế giữ bí mật premium.

## 3. Nội dung và GEO

- [ ] Trang chủ trả lời trực tiếp ứng dụng là gì và cách bắt đầu.
- [ ] Category giải thích phù hợp với ai và liên kết tới pack thực tế.
- [ ] Pack có đối tượng, count, ví dụ, free/premium, cách thử và phạm vi mua rõ ràng.
- [ ] Nội dung viết để người dùng hiểu, không nhồi từ khóa “truth or dare/thật hay thách”.
- [ ] Câu trả lời ngắn ở đầu, chi tiết và ví dụ phía sau; dùng bảng khi thực sự giúp so sánh.
- [ ] FAQ là câu hỏi thật như trial bao nhiêu câu, offline được không, đổi máy thế nào.
- [ ] Có thông tin đơn vị biên tập/liên hệ và ngày cập nhật phản ánh thực tế.
- [ ] Không tạo hàng loạt landing page gần giống nhau bằng đổi tên đối tượng.
- [ ] Liên kết nội bộ giữa luật chơi → category → pack → chơi; không để trang mồ côi.
- [ ] Không hứa AI chắc chắn trích dẫn hoặc một điểm “GEO” bảo đảm thứ hạng.
- [ ] `llms.txt` chỉ là tùy chọn, không thay cho HTML, sitemap hoặc crawlability.

Google nêu rằng AI Overviews/AI Mode không yêu cầu tối ưu kỹ thuật đặc biệt hoặc schema AI riêng. Checklist này ưu tiên nội dung có ích và dễ truy cập. [Google AI features](https://developers.google.com/search/docs/appearance/ai-features).

## 4. Structured data và chia sẻ

- [ ] `WebSite` mô tả đúng brand và URL.
- [ ] BreadcrumbList khớp đường dẫn điều hướng thật.
- [ ] CollectionPage/ItemList chỉ liệt kê bộ có thật và truy cập được.
- [ ] Nếu có SoftwareApplication/Offer, các thuộc tính và giá khớp đúng nội dung nhìn thấy.
- [ ] Không thêm review, rating hoặc số người dùng giả.
- [ ] Không kỳ vọng FAQ schema tự mang lại rich result cho website trò chơi.
- [ ] JSON-LD hợp lệ, serialize an toàn và kiểm tra bằng công cụ validator phù hợp.
- [ ] OG title/description/image, Twitter card, favicon và ảnh share rõ chữ trên mobile.
- [ ] Share URL sạch, không bao gồm order, token hoặc mã khôi phục.

## 5. Hiệu năng và trải nghiệm

- [ ] Font tiếng Việt tải tối ưu; không thay font gây nhảy layout đáng kể.
- [ ] Ảnh có kích thước, responsive và alt phù hợp.
- [ ] Không tải mọi JSON vào initial bundle.
- [ ] Không popup cài app/paywall ngay lần đầu trước khi người dùng hiểu ứng dụng.
- [ ] Mobile không tràn ngang; focus, contrast và vùng chạm đạt yêu cầu spec.
- [ ] Lab mobile kiểm tra trước launch; theo dõi field p75 sau khi đủ dữ liệu.
- [ ] Mục tiêu LCP ≤2,5s; INP ≤200ms; CLS ≤0,1. [Web Vitals](https://web.dev/articles/vitals).
- [ ] Service worker không phục vụ mãi HTML cũ hoặc cache nhầm checkout/API.

## 6. Bằng chứng nghiệm thu cần lưu

| Kiểm tra        | Bằng chứng                                                    |
| --------------- | ------------------------------------------------------------- |
| SSG             | Build output + HTML response của home/category/pack/hướng dẫn |
| Metadata        | Title, description, canonical, lang của mẫu URL từng loại     |
| Index policy    | robots, sitemap, noindex và status codes thực tế              |
| Structured data | Kết quả validator và đối chiếu nội dung visible               |
| Sharing         | Preview link trên thiết bị/app mục tiêu                       |
| Cache           | Response headers catalog, versioned JSON, API private và SW   |
| Mobile          | Screenshot 320/390px và test thao tác cơ bản                  |
| Performance     | Lab report trước launch, field dashboard khi có dữ liệu       |
| Content         | Danh sách trang review, người review, ngày chỉnh sửa thật     |

## 7. Sau launch

- [ ] Xác minh Search Console, submit sitemap và kiểm tra URL mẫu.
- [ ] Theo dõi index coverage, query, CTR, landing page và organic conversion.
- [ ] Đo referral từ công cụ AI khi referrer có sẵn; không giả định đo được toàn bộ traffic AI.
- [ ] Phân biệt mục tiêu kỹ thuật hoàn thành với kết quả thứ hạng/index do hệ thống tìm kiếm quyết định.
- [ ] Sửa nội dung dựa trên câu hỏi/support/search thực tế; cập nhật sitemap khi nội dung thay đổi.

Nguyên tắc SEO nền tảng tham khảo từ [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide); tiêu chí checklist cụ thể là yêu cầu nghiệm thu của dự án.
