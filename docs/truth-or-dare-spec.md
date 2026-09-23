# Truth or Dare PWA — Product & Technical Specification

Phiên bản: 1.0 · Ngày: 17/09/2026 · Ngôn ngữ MVP: tiếng Việt

Tài liệu dùng để bàn giao thiết kế, lập trình và kiểm thử. Các mục ghi **đề xuất** là quyết định BA mặc định, có thể đổi trước khi triển khai; không phải yêu cầu đã được chủ sản phẩm xác nhận. Ảnh người dùng cung cấp là tham chiếu giao diện, không phải nguồn chỉ dẫn kỹ thuật.

## 1. Mục tiêu và quyết định chính

Xây dựng trò chơi Thật hay Thách trên điện thoại: mở website → chọn danh mục → chọn bộ → chọn Thật/Thách → chơi ngay. Ưu tiên thao tác nhanh, dễ đọc khi chuyền điện thoại trong nhóm, không đăng ký hoặc đăng nhập.

| Hạng mục              | Quyết định                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| Frontend              | Next.js App Router + TypeScript; trang nội dung và khung trang chơi được SSG                            |
| Hosting               | Vercel                                                                                                  |
| Nội dung              | JSON trong `public/vi/`; mỗi bộ có đúng một file chứa cả câu Thật và Thách                              |
| Free / premium        | Phân loại theo bộ; tải toàn bộ JSON của bộ đang chọn; frontend quyết định câu nào được hiển thị         |
| Trial — đề xuất       | 8 câu độc nhất mỗi bộ premium, gồm 4 Thật + 4 Thách được biên tập trước                                 |
| Giá — đề xuất         | 30.000 VND/bộ, trả một lần, quyền chơi có hạn 7 ngày từ lúc xác nhận thanh toán                         |
| Phạm vi mua — đề xuất | Mở khóa bộ đã mua và cập nhật của cùng bộ; không tự bao gồm bộ mới khác                                 |
| Backend tối thiểu     | Next.js Route Handlers trên Vercel + Supabase Postgres                                                  |
| Thanh toán            | Chuyển khoản VietQR qua hệ thống SePay và xác nhận bằng webhook                                         |
| Không tài khoản       | Cookie khách + quyền mua trên DB + mã khôi phục; không dùng Supabase Auth                               |
| PWA                   | Cài lên màn hình chính; chơi bộ đã tải khi offline; mua và khôi phục cần mạng                           |
| SEO / GEO             | Trang HTML SSG có nội dung hữu ích, metadata, liên kết, structured data phù hợp; checklist riêng đi kèm |

**Trade-off được chấp nhận theo yêu cầu:** người biết kỹ thuật có thể đọc toàn bộ câu premium trong JSON hoặc bỏ qua khóa frontend. Đây là paywall về trải nghiệm, không phải cơ chế bảo mật nội dung. Không xây DRM, mã hóa câu hỏi hoặc API trả từng câu. Tuy nhiên, số tiền và trạng thái thanh toán vẫn do backend xác nhận để tránh mở khóa nhầm, thất lạc đơn và ghi nhận doanh thu sai.

## 2. Phạm vi MVP

### Có trong MVP

- Trang chủ, danh mục, giới thiệu từng bộ và hướng dẫn chơi bằng tiếng Việt.
- Bộ free và premium; duyệt/lọc theo danh mục, trạng thái và tên bộ.
- Một bộ hoạt động trong mỗi ván; cùng một bộ có thể thuộc nhiều danh mục.
- Rút ngẫu nhiên theo loại, không lặp trong ván, bỏ qua, chơi lại, đổi bộ, tiếp tục ván.
- Trial, paywall, tạo đơn, QR, tự xác nhận, mở khóa, khôi phục quyền mua.
- PWA, offline cho nội dung đã tải, trạng thái cập nhật phiên bản.
- SEO kỹ thuật, nội dung hỗ trợ GEO, analytics tối thiểu, kiểm thử và hướng dẫn vận hành.

### Chưa làm

Phòng chơi trực tuyến, đồng bộ lượt giữa nhiều điện thoại, chat, tài khoản, subscription, mã giảm giá, tích điểm, UGC, dashboard quản trị riêng, push notification. Nội dung sửa qua Git; giá và đơn xử lý bằng backend/Supabase với quyền quản trị nội bộ.

## 3. Mô hình nội dung và sitemap

**Category** là chủ đề, **pack** là sản phẩm/bộ câu hỏi, **question** là một câu có loại `truth` hoặc `dare`. Không dùng category làm mã sản phẩm thanh toán. Ví dụ danh mục Bạn bè có một bộ free và hai bộ premium.

| URL đề xuất                                                      | Nội dung                                           | Render / index                               |
| ---------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| `/`                                                              | Redirect cố định sang `/vi`                        | Không là trang nội dung trùng                |
| `/vi`                                                            | Giới thiệu, danh mục, bộ nổi bật, cách chơi ngắn   | SSG / index                                  |
| `/vi/danh-muc`                                                   | Tất cả danh mục                                    | SSG / index                                  |
| `/vi/danh-muc/[slug]`                                            | Giới thiệu chủ đề, danh sách bộ                    | SSG / index                                  |
| `/vi/bo-cau-hoi/[slug]`                                          | Số câu, đối tượng, preview, quyền mua, FAQ hữu ích | SSG / index                                  |
| `/vi/choi/[packSlug]`                                            | Khung chơi và logic client                         | SSG / noindex                                |
| `/vi/cach-choi`                                                  | Luật và các biến thể chơi                          | SSG / index                                  |
| `/vi/huong-dan/[slug]`                                           | Bài hướng dẫn được biên tập                        | SSG / index                                  |
| `/vi/thanh-toan`                                                 | Checkout theo đơn đang lưu trên thiết bị           | SSG shell / noindex                          |
| `/vi/khoi-phuc`                                                  | Nhập mã khôi phục                                  | SSG shell / noindex                          |
| `/vi/chinh-sach-thanh-toan`, `/vi/quyen-rieng-tu`, `/vi/lien-he` | Thông tin minh bạch và hỗ trợ                      | SSG; index nếu có nội dung hoàn chỉnh        |
| `/api/*`                                                         | Session, đơn, quyền chơi, webhook                  | Runtime / không index, không cache công khai |

Điều hướng category → pack → chơi là chuẩn. Nếu category chỉ có một bộ, nút “Chơi ngay” có thể vào thẳng bộ đó; trang giới thiệu bộ vẫn tồn tại để người dùng đọc và máy tìm kiếm truy cập.

## 4. Luật chơi

1. Chọn bộ. Với bộ free hoặc đã mua: “Bắt đầu chơi”. Với premium chưa mua: “Chơi thử 8 câu”, bên cạnh có thông tin giá và số câu đầy đủ.
2. Màn đầu chưa rút câu: hiển thị “Bạn chọn Thật hay Thách?”. Chỉ rút khi người dùng bấm loại.
3. Mỗi loại có một hàng đợi được shuffle; lấy từng ID không lặp. State chỉ tạo phía client sau hydration, tránh random làm lệch HTML.
4. Nút Thật/Thách dưới thẻ vừa chọn loại vừa chuyển sang câu kế tiếp. Không cần thêm bước xác nhận “Đã làm xong”.
5. “Bỏ qua” rút câu mới cùng loại nếu còn quyền và còn câu. Câu đã hiển thị vẫn tính là đã xem, kể cả bỏ qua.
6. Bộ đếm ghi “Đã xem”, không suy diễn người dùng hoàn thành thử thách. Ví dụ “Thật: 3 · Thách: 2 · Đã xem 5/100”.
7. Khi một loại hết, hiển thị “Bạn đã xem hết câu Thật”, vô hiệu hóa loại đó, gợi ý loại còn lại. Không tự đổi loại hoặc lặp câu một cách bất ngờ.
8. Khi hết cả bộ: màn hoàn thành với “Xáo trộn và chơi lại” / “Chọn bộ khác”. Chơi lại reset tiến độ ván, không reset quyền mua hoặc lịch sử trial.
9. Lưu pack ID, content version, hàng đợi, câu hiện tại, câu đã xem và trial IDs vào IndexedDB/localStorage sau mỗi lần rút. Refresh tiếp tục đúng câu, không tăng bộ đếm.
10. Khóa thao tác trong chuyển cảnh; double tap không rút hai câu hoặc tính hai lượt.

Tên người chơi là tùy chọn giai đoạn sau; MVP không cần nhập tên để chơi. Các câu cần tôn trọng quyền bỏ qua và sự đồng thuận; tránh nội dung nguy hiểm hoặc ép buộc. Nếu sau này có bộ người lớn, tách nhãn tuổi và bước xác nhận phù hợp, không trộn vào bộ gia đình.

## 5. Trial và premium — đề xuất BA

### Vì sao chọn 8 câu?

5 câu có thể quá ngắn để cả nhóm cảm nhận chất lượng; 10 câu làm paywall xuất hiện muộn hơn. 8 là giả thuyết khởi đầu cân bằng, không phải con số đã được chứng minh bằng dữ liệu. Nên tạo 4 câu Thật + 4 câu Thách đủ hay và đại diện cho bộ; không dùng 8 câu ngẫu nhiên từ toàn bộ mỗi lần vào.

### Quy tắc trial rõ ràng

- Mỗi pack premium có `trialQuestionIds`: đúng 8 ID, 4 mỗi loại. Không reset theo ván/ngày/refresh.
- Người dùng có thể thử các bộ premium khác nhau; giới hạn áp dụng riêng từng pack trên trình duyệt.
- Chọn Thật liên tiếp chỉ xem tối đa 4 câu Thật trial. Sau đó hiển thị “Bạn còn 4 câu Thách để thử” và tùy chọn mở khóa; không coi là đã hết cả trial.
- Badge ban đầu “8 câu miễn phí”; sau khi rút hiển thị “Đã thử 3/8”. Chuyển CTA phù hợp khi một loại đã hết.
- Xem hết câu thứ 8 vẫn được đọc câu đó. Khi yêu cầu câu tiếp theo mới bật paywall, không che nội dung đang đọc giữa chừng.
- Trial chỉ cho xem tập preview cố định. Reload hoặc chơi lại có thể xem lại các câu preview, nhưng không nhận thêm câu premium mới.
- Mua thành công mở toàn bộ hàng đợi; giữ lịch sử đã xem trong ván để câu tiếp theo không lặp lại 8 câu trial.
- Thay đổi nội dung giữ ID ổn định. Không đổi trial IDs thường xuyên để vô tình tạo thêm lượt thử; sửa câu vẫn giữ ID nếu cùng ý nghĩa.

### Định nghĩa sản phẩm mua

MVP bán **một pack**, giá mặc định **30.000đ**, không phải 30.000đ cho một lần chơi hoặc toàn thư viện. Quyền mua có hạn 7 ngày; cập nhật cùng `packId` không gia hạn. Hết hạn cần mua lại. Tránh dùng chữ “trọn đời” nếu chưa có chính sách duy trì dịch vụ tương ứng.

Giá lưu trong bảng `products`, số nguyên VND. Frontend lấy báo giá hiện tại trước checkout. Đơn lưu snapshot giá, tên bộ và phiên bản giá lúc tạo; đổi giá không làm thay đổi đơn đã tạo trong thời gian còn hiệu lực. Giá hiển thị trên trang SSG chỉ là thông tin tại lần build; khi chưa xác nhận giá hiện tại phải ghi “Đang kiểm tra giá”, không tạo đơn theo giá cũ một cách âm thầm.

Trong tương lai có thể thử “30.000đ mở toàn bộ bộ hiện có”, nhưng đây là sản phẩm khác với phạm vi quyền rõ ràng. Không đưa cả bundle và mua lẻ vào MVP vì làm phức tạp quyết định mua.

### Copy paywall

> Bạn đã thử 8 câu của bộ [Tên bộ].
>
> Mở toàn bộ [N] câu để cuộc vui tiếp tục.
>
> **30.000đ · Thanh toán một lần · Chơi lại không giới hạn**
>
> Nút chính: **Mở khóa bộ này — 30.000đ**
>
> Nút phụ: **Chọn bộ miễn phí**
>
> Link: **Đã mua? Khôi phục**

Giá trong copy là biến động theo báo giá. Có dòng ngắn “Giữ mã khôi phục để chơi trên thiết bị khác”. Paywall đóng được; không timer giảm giá giả, không ép cài app.

## 6. UX/UI theo ảnh tham chiếu

Ảnh có nền xanh đen, thẻ hồng gradient lớn bo góc, tiêu đề/emoji trắng, nội dung căn giữa, hai nút pill tím và hồng, bộ đếm nhỏ bên dưới. Giữ bố cục tập trung vào một câu, nhưng bổ sung điều hướng, trạng thái trial và phản hồi thanh toán.

### Design tokens đề xuất

| Token       | Giá trị ban đầu                                                        |
| ----------- | ---------------------------------------------------------------------- |
| Nền trang   | `#151D2B` đến `#1B2635`                                                |
| Bề mặt phụ  | `#243044`                                                              |
| Thật        | Nút `#8B20D9`; thẻ gradient tím                                        |
| Thách       | Nút `#C91467`; thẻ gradient `#D82C88` → `#B81163`                      |
| Text chính  | `#FFFFFF`                                                              |
| Text phụ    | `#CBD5E1`                                                              |
| Radius thẻ  | 24px                                                                   |
| Radius nút  | 999px                                                                  |
| Font        | Be Vietnam Pro hoặc font sans có tiếng Việt; self-host qua `next/font` |
| Cỡ câu hỏi  | `clamp(22px, 4.5vw, 28px)`, weight 650–700, line-height 1.4            |
| Chuyển cảnh | Fade/slide nhẹ 160–220ms, tắt khi `prefers-reduced-motion`             |

Đây là token đề xuất lấy cảm hứng từ ảnh, không phải lấy mẫu màu chính xác. Thẻ được làm đậm hơn để chữ trắng dễ đọc; phải đo contrast trên toàn dải gradient trước nghiệm thu, điều chỉnh nếu thiếu.

### Bố cục màn chơi

- Mobile: padding ngang 16–20px; vùng nội dung rộng tối đa 560px ở desktop, căn giữa.
- Header nhỏ: quay lại, tên bộ, badge Free/Premium/Đã mở khóa, menu trợ giúp.
- Thẻ có `min-height` khoảng 280px mobile, 360–400px desktop; tăng theo nội dung, không cắt chữ hoặc ép font quá nhỏ.
- Thẻ có nhãn “💭 Thật” hoặc “💖 Thách”; không truyền đạt loại chỉ bằng màu.
- Dưới thẻ: “Chọn loại câu tiếp theo”, hai nút chính cao tối thiểu 56px; gap 16px.
- Hàng phụ: bỏ qua, tiến độ đã xem, trial còn lại. Đặt hành động quan trọng trong vùng ngón tay; tôn trọng safe-area và `100dvh`.
- Lỗi tải có thông báo ngắn + “Thử lại”; không hiển thị thẻ trắng hoặc spinner vô hạn.

### Các màn hình cần thiết kế

| Màn                  | Thành phần bắt buộc                                                                     |
| -------------------- | --------------------------------------------------------------------------------------- |
| Trang chủ / danh mục | Tên, icon, mô tả một câu, số bộ, CTA chơi; không popup khi mới vào                      |
| Danh sách bộ         | Tên, số câu Thật/Thách, nhãn free/premium, nhãn đã mua, preview                         |
| Chi tiết bộ          | Đối tượng, số người gợi ý, mức độ, mẫu câu, cách chơi, CTA, điều kiện mua               |
| Chơi                 | Empty/loading/active/type exhausted/all exhausted/offline/error                         |
| Paywall              | Lợi ích cụ thể, giá, phạm vi quyền, đóng, đổi bộ, khôi phục                             |
| Checkout             | QR, số tiền, ngân hàng, tên chủ tài khoản, nội dung chuyển khoản, copy/save, trạng thái |
| Thành công           | “Đã mở khóa”, CTA “Chơi tiếp”, mã khôi phục có copy/lưu                                 |
| Khôi phục            | Ô nhập mã, đang kiểm tra, thành công, mã không hợp lệ, mất mã cần hỗ trợ                |

Accessibility: focus nhìn rõ, điều khiển bằng bàn phím, nút có accessible name, trạng thái câu dùng `aria-live="polite"`, modal giữ focus và trả focus khi đóng; contrast tối thiểu 4.5:1 cho chữ thường, 3:1 cho chữ lớn. Nút/icon tương tác tối thiểu 44×44px. Không tự phát âm thanh hoặc rung mặc định.

## 7. Kiến trúc Next.js SSG

```text
Git: categories + packs + mỗi pack một JSON
                  │ build / validate
                  ▼
        Next.js SSG HTML + static JSON ─── Vercel CDN
                  │
          Browser / installed PWA
          ├─ game state + cache offline
          └─ /api/session, orders, entitlements
                       │
                 Vercel Functions ─── Supabase Postgres
                       ▲
                 SePay webhook
```

Dùng `generateStaticParams` cho locale, category, pack và bài viết. Đọc JSON từ filesystem lúc build để tạo HTML/metadata; không gọi HTTP vòng về chính website trong build. Shell trò chơi SSG, Client Component xử lý lượt chơi, trial và quyền mua sau hydration. Không đọc cookie ở root layout hoặc các page SSG.

**SSG không đồng nghĩa `output: 'export'`.** Đề xuất build Next.js bình thường trên Vercel: các page vẫn pre-render, còn Route Handlers thanh toán chạy runtime. Static export hoàn toàn không cung cấp runtime POST/cookie của hệ thống này. Nếu muốn export tuyệt đối, phải chuyển các API sang Supabase Edge Functions hoặc backend riêng; đó là phương án thay thế, không phải kiến trúc MVP đã chọn. [Next.js Static Exports](https://nextjs.org/docs/app/guides/static-exports).

Không đưa toàn bộ pack vào client bundle. Client chỉ fetch file của bộ được chọn; sau đó chuyển câu hoàn toàn local. Trang giới thiệu chỉ nhúng mẫu câu công khai cần cho nội dung SEO, không render hàng trăm câu premium ẩn bằng CSS.

### Cấu trúc thư mục đề xuất

```text
app/
  [locale]/
    page.tsx
    danh-muc/[slug]/page.tsx
    bo-cau-hoi/[slug]/page.tsx
    choi/[packSlug]/page.tsx
    thanh-toan/page.tsx
    khoi-phuc/page.tsx
  api/
    session/route.ts
    products/[packId]/route.ts
    orders/route.ts
    orders/[orderId]/route.ts
    entitlements/route.ts
    entitlements/restore/route.ts
    webhooks/sepay/route.ts
  manifest.ts
  sitemap.ts
  robots.ts
public/
  vi/categories.json
  vi/packs.json
  vi/questions/ban-be-free.v1.json
  vi/questions/ban-be-premium.v1.json
  sw.js
  icons/
content/vi/huong-dan/
lib/content/
lib/game/
lib/payments/
lib/db/
```

## 8. Data contract JSON

Đường dẫn vật lý `public/vi/categories.json` được truy cập qua URL **`/vi/categories.json`**, không có `/public`. Đây là cách Next.js phục vụ thư mục public. [Next.js public folder](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder).

### `categories.json`

```json
{
  "schemaVersion": 1,
  "contentVersion": "2026-09-17.1",
  "locale": "vi",
  "categories": [
    {
      "id": "friends",
      "slug": "ban-be",
      "name": "Bạn bè",
      "description": "Những câu hỏi giúp cả nhóm hiểu nhau hơn.",
      "icon": "🎉",
      "packIds": ["friends-free", "friends-premium"],
      "sortOrder": 10
    }
  ]
}
```

### `packs.json` — catalog nhẹ, không chứa toàn bộ câu

```json
{
  "schemaVersion": 1,
  "contentVersion": "2026-09-17.1",
  "locale": "vi",
  "packs": [
    {
      "id": "friends-premium",
      "slug": "ban-be-gan-ket",
      "title": "Bạn bè gắn kết",
      "description": "Một bộ câu hỏi cho nhóm bạn thân.",
      "tier": "premium",
      "questionFile": "/vi/questions/ban-be-premium.v1.json",
      "contentVersion": "1",
      "questionCount": 100,
      "truthCount": 50,
      "dareCount": 50,
      "trialCount": 8,
      "priceHintVnd": 30000,
      "productId": "pack-friends-premium",
      "ageLabel": "16+",
      "playerRange": { "min": 2, "max": 8 },
      "published": true
    }
  ]
}
```

Các số 100/50/50 và nhãn tuổi trong ví dụ là dữ liệu minh họa, không là cam kết nội dung đã có. Count thực tế phải sinh từ file bộ. `priceHintVnd` phục vụ bản SSG; giá tạo đơn lấy từ DB. Nếu không muốn đồng bộ giá qua build, bỏ giá cụ thể khỏi HTML SSG và chỉ render giá client sau fetch.

### File của một bộ

```json
{
  "schemaVersion": 1,
  "packId": "friends-premium",
  "locale": "vi",
  "contentVersion": "1",
  "trialQuestionIds": ["t01", "t02", "t03", "t04", "d01", "d02", "d03", "d04"],
  "questions": [
    { "id": "t01", "type": "truth", "text": "Kỷ niệm nào với nhóm khiến bạn vui nhất?" },
    { "id": "t02", "type": "truth", "text": "Bạn muốn thử sở thích nào cùng cả nhóm?" },
    { "id": "t03", "type": "truth", "text": "Điều nhỏ nào có thể làm bạn vui cả ngày?" },
    { "id": "t04", "type": "truth", "text": "Ấn tượng đầu tiên của bạn về nhóm là gì?" },
    { "id": "d01", "type": "dare", "text": "Diễn tả một bộ phim bằng động tác để nhóm đoán." },
    { "id": "d02", "type": "dare", "text": "Hát một đoạn ngắn bằng giọng robot." },
    { "id": "d03", "type": "dare", "text": "Nói một lời khen chân thành với người bên cạnh." },
    { "id": "d04", "type": "dare", "text": "Tạo một dáng chụp ảnh vui nhộn." },
    { "id": "t05", "type": "truth", "text": "Một mục tiêu bạn muốn làm được trong năm nay là gì?" },
    { "id": "d05", "type": "dare", "text": "Kể một câu chuyện ngắn với ba từ do nhóm chọn." }
  ]
}
```

Ví dụ file bộ rút gọn còn 10 câu để mô tả schema; catalog production phải phản ánh đúng dữ liệu đầy đủ, không sao chép count 100 của ví dụ vào bộ này.

### Validation khi build

- Validate schema, locale, ID/slug duy nhất, category trỏ pack tồn tại, pack trỏ file tồn tại.
- ID câu duy nhất trong pack; type hợp lệ; text không rỗng, không HTML; cảnh báo câu trùng nội dung.
- Pack premium phải có nhiều câu hơn trial; đúng 8 trial IDs hợp lệ và cân bằng 4/4 ở MVP.
- Free có `trialQuestionIds: []`; số câu và count từng loại sinh tự động.
- `packId` ổn định khi đổi slug, đổi giá hoặc cập nhật; không cấp quyền dựa trên slug.
- File lỗi làm build thất bại trước deploy; nội dung phải qua review biên tập.

## 9. CDN và cache

**Có:** Vercel phục vụ static asset qua hạ tầng CDN. **Cần bổ sung:** đặt file trong `public` không có nghĩa trình duyệt tự giữ file một năm; Next.js mặc định dùng `Cache-Control: public, max-age=0` cho public assets. Tách chính sách browser, CDN và service worker. [Vercel Caching](https://vercel.com/docs/caching), [Next.js public folder](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder).

| Tài nguyên                                           | Browser policy đề xuất                | CDN / PWA                                                   |
| ---------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `/vi/categories.json`, `/vi/packs.json`              | `public, max-age=0, must-revalidate`  | Vercel CDN TTL 300s, SWR 600s; SW network-first có fallback |
| `/vi/questions/*.vN.json` hoặc tên có content hash   | `public, max-age=31536000, immutable` | Cache-first vì URL đổi khi nội dung đổi                     |
| `/api/session`, `/api/orders*`, `/api/entitlements*` | `private, no-store`                   | Không CDN, không service worker cache                       |
| `/api/products/*`                                    | `no-store` ở MVP                      | Kiểm tra giá hiện tại; chưa cần tối ưu cache                |
| `/sw.js`                                             | `no-cache`                            | Kiểm tra cập nhật; không immutable                          |
| HTML SSG và `_next/static/*`                         | Dùng cơ chế framework                 | Không override rộng làm ảnh hưởng HTML/RSC                  |

Thiết lập cụ thể trong `headers()` của Next.js hoặc `vercel.json`, chọn một nguồn cấu hình. Cho catalog có thể dùng `Vercel-CDN-Cache-Control: public, s-maxage=300, stale-while-revalidate=600` riêng với header browser bên trên. Header dành riêng Vercel có thứ tự ưu tiên riêng; kiểm tra header thực tế sau deploy thay vì suy từ config. [Vercel Cache-Control headers](https://vercel.com/docs/caching/cache-control-headers).

Khi sửa bộ: tạo file `v2` hoặc hash mới → cập nhật catalog → build/deploy. Giữ các file version trước để client có catalog cũ vẫn tải được, đặc biệt sau rollback. Phiên đang chơi ghim version đến hết ván; gợi ý đổi sang bản mới sau ván, không thay câu giữa chừng. Không ghi đè nội dung khác vào cùng URL có `immutable`.

Tiêu chí kiểm tra production: fetch lặp lại catalog và pack, đọc `Cache-Control`, `Age`/`x-vercel-cache` nếu có; sửa version và kiểm tra client nhận dữ liệu mới; API đơn không có cache HIT chứa dữ liệu người khác. Service worker phải được kiểm tra riêng vì có thể che kết quả CDN.

## 10. Không authentication: nhận diện và khôi phục

Không màn đăng nhập, email hoặc mật khẩu; không dùng Supabase Auth. Backend vẫn cần một **credential khách** để đơn và quyền mua thuộc đúng phiên thiết bị.

- Chơi free/trial không cần backend hoạt động. Khi mở checkout hoặc kiểm tra quyền online, `POST /api/session` tạo cookie ngẫu nhiên ít nhất 128-bit, `HttpOnly`, `Secure`, `SameSite=Lax`, thời hạn đề xuất 365 ngày và gia hạn khi hoạt động.
- DB lưu hash token, không lưu raw cookie. Cookie chỉ định danh khách, không chứa cờ `paid=true` có thể tự sửa.
- Endpoint thay đổi dữ liệu từ browser kiểm tra Origin/same-origin và có rate limit. Webhook dùng xác thực SePay riêng, không dùng cơ chế Origin của browser.
- Quyền mua lưu lâu dài trong DB. LocalStorage/IndexedDB giữ bản quyền chơi gần nhất để UX nhanh và offline; backend là nguồn chuẩn cho lịch sử mua khi online.
- Trình duyệt và PWA cài riêng có thể không chia sẻ storage như kỳ vọng trên mọi nền tảng; luôn cung cấp khôi phục bằng mã và kiểm thử iOS thực tế.

### Mã khôi phục

Quyền chơi và mã khôi phục hết hạn sau 7 ngày từ lúc cấp quyền sau xác nhận thanh toán. Mua lại sau hết hạn tạo quyền mới 7 ngày; khôi phục không gia hạn. Mỗi đơn paid có mã ngẫu nhiên tối thiểu 128-bit, hiển thị ở màn thành công và “Bộ đã mua”. Người dùng có thể copy hoặc lưu tệp. Mã này cho quyền khôi phục chính pack đã mua, không phải số đơn dễ đoán hoặc nội dung chuyển khoản.

Đề xuất lưu hash để tra cứu và bản mã hóa ở server để khách sở hữu đơn có thể xem/lưu lại mã. Khóa mã hóa ở env backend; không gửi token vào analytics, URL query hoặc logs. Thiết bị mới nhập mã → backend kiểm tra → thêm entitlement cho guest mới. Không làm mất quyền ở thiết bị cũ; chấp nhận người dùng chia sẻ mã, cùng triết lý bảo vệ nội dung nhẹ của dự án.

Nếu xóa cookie nhưng còn mã thì khôi phục được; mất cả cookie và mã thì hỗ trợ đối soát thủ công bằng chứng từ/mã giao dịch, không tự xác nhận chỉ dựa trên ảnh chụp. Nhắc lưu mã ở trang thành công nhưng không chặn “Chơi tiếp”. Không hứa tự đồng bộ đa thiết bị khi chưa có tài khoản.

## 11. Thanh toán SePay

### Luồng chuẩn

1. User bấm mở khóa. Client lấy giá hiện tại; hiển thị pack, giá, quyền mua và cách khôi phục.
2. Client gửi `POST /api/orders` chỉ với `packId` + idempotency key; server tự lấy giá, product active và guest từ cookie.
3. Server tạo đơn `pending`, snapshot giá VND, mã chuyển khoản duy nhất dạng tiền tố + suffix ngắn phù hợp cấu hình SePay. Ví dụ minh họa `TOD8K4M2R7Q`; phải cấu hình cùng prefix/suffix trên SePay. Không dùng mã này làm secret khôi phục.
4. Đơn có hạn checkout đề xuất 15 phút. Backend trả số tiền, tài khoản nhận, nội dung chuyển khoản, QR URL và expiry. QR phải chứa đúng dữ liệu server; không cho client tự chọn tài khoản nhận.
5. User quét bằng điện thoại khác hoặc lưu QR/copy thông tin trên cùng điện thoại. Không giả định mọi app ngân hàng hỗ trợ cùng một deep link.
6. Ngân hàng nhận tiền → SePay gửi webhook → backend xác thực và đối chiếu → DB chuyển paid và tạo entitlement trong cùng transaction.
7. Checkout polling API trạng thái của chính hệ thống mỗi 3 giây khi tab đang mở; sau 60 giây giảm còn 5–10 giây. Dừng khi tab ẩn, tiếp tục ngay khi focus/online. Không gọi SePay từ browser.
8. Khi backend trả paid: hiển thị thành công, cập nhật quyền local, cho “Chơi tiếp” đúng bộ và giữ tiến độ. Poll sau thành công dừng hoàn toàn.

SePay có tài liệu tạo VietQR theo tài khoản, ngân hàng, số tiền và nội dung; tích hợp dùng endpoint được tài liệu hiện hành hỗ trợ, không coi URL ảnh QR là API tạo order. [SePay tạo QR](https://docs.sepay.vn/tao-qr-code-vietqr-dong.html).

### UI checkout

- QR nằm trong nền trắng, đủ kích thước, không gradient phủ lên mã.
- Hiển thị số tiền lớn, ngân hàng, tên người nhận, số tài khoản, nội dung chuyển khoản và nút copy từng mục.
- “Đang chờ thanh toán”; sau khoảng 60 giây chưa xác nhận: “Chưa ghi nhận giao dịch. Nếu đã chuyển, vui lòng chờ hoặc kiểm tra trạng thái.”
- Nút “Tôi đã chuyển khoản” chỉ gọi kiểm tra trạng thái, tuyệt đối không tự mở khóa.
- Khi offline: “Cần kết nối để xác nhận thanh toán”; giữ đơn/tiến độ. Không bảo người dùng chuyển lần nữa.
- Sau khi đổi sang app ngân hàng rồi quay lại, refresh trạng thái ngay.
- Khi hết 15 phút, dừng CTA chuyển khoản mới với QR đó, có “Tạo đơn mới” và “Tôi đã chuyển”. QR chuyển khoản cũ vẫn có thể được ngân hàng chấp nhận; expiry là trạng thái hệ thống, không phải khả năng vô hiệu hóa QR ngân hàng.

### Webhook và tính nhất quán

SePay gửi giao dịch có `id`, `transferType`, `transferAmount`, tài khoản và nội dung; webhook có thể được gửi lặp. Xác thực request, kiểm tra giao dịch vào đúng tài khoản, mã đơn khớp và số tiền. Đặt unique cho ID giao dịch provider; chỉ phản hồi thành công sau khi ghi nhận bền vững. [SePay tích hợp webhook](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook).

Đề xuất dùng HMAC-SHA256 theo chính xác hướng dẫn SePay, đọc raw body trước khi parse, kiểm tra header/timestamp theo protocol. Nếu tài khoản tích hợp dùng API Key, kiểm tra server-side header được cấu hình; không dùng webhook không xác thực. Secret chỉ nằm ở backend. [SePay xác thực webhook](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc).

Thuật toán xử lý nghiệp vụ của dự án:

1. Xác thực trước; request không hợp lệ không thay đổi DB.
2. Trong một DB transaction/RPC: insert event với unique provider transaction ID, lock đơn, đối chiếu và cập nhật trạng thái, tạo purchase/entitlement, đánh dấu event đã xử lý.
3. Duplicate đã commit: trả acknowledgement thành công và không cấp thêm quyền. Lỗi DB: rollback toàn bộ, trả lỗi để provider retry; không để event đã lưu nhưng entitlement mất mà lần retry bị bỏ qua.
4. Event hợp lệ nhưng chưa khớp đơn hoặc sai số tiền: lưu `unmatched`/`review_required`, phản hồi đã nhận sau khi lưu; không retry vô hạn một lỗi nghiệp vụ.
5. Một transaction chỉ có thể thanh toán một order. Một order có tối đa một purchase chính; giao dịch thêm vào cùng order được ghi nhận để xử lý trùng tiền.

### Trường hợp ngoại lệ

| Tình huống                   | Chính sách MVP đề xuất                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Bấm mua nhiều lần            | Idempotency key cùng guest trả cùng đơn; kiểm tra/reuse đơn pending cùng pack còn hạn                 |
| Đã sở hữu pack               | Trả quyền hiện có, không tạo QR thu tiền mới                                                          |
| Thiếu hoặc thừa tiền         | Review thủ công, không tự mở khóa; MVP không cộng dồn nhiều chuyển khoản nhỏ                          |
| Sai/mất mã chuyển khoản      | Lưu unmatched và đối soát hỗ trợ; không đoán theo số tiền 30.000đ vì dễ trùng                         |
| Trả tiền sau khi hết hạn     | Nếu đúng giá snapshot, đúng mã/tài khoản và trong 24h từ lúc tạo: vẫn cấp quyền; ngoài 24h đưa review |
| Webhook đến trễ              | Dùng thời điểm giao dịch ngân hàng để xét cửa sổ, không dùng thời điểm nhận webhook                   |
| Hai đơn cùng pack đều đã trả | Cấp một quyền chơi, đánh dấu thanh toán dư; hỗ trợ xử lý tiền thừa                                    |
| Đóng tab sau chuyển khoản    | Webhook vẫn ghi paid; mở lại cùng guest đọc DB để mở khóa                                             |
| Giá thay đổi                 | Giữ giá snapshot đơn; đơn mới dùng giá mới                                                            |
| Webhook thất lạc             | Job đối soát dùng API SePay; cùng pipeline idempotent như webhook                                     |
| Hoàn tiền                    | Xử lý nội bộ, ghi audit, thu hồi entitlement online; cache offline có thể còn quyền theo trade-off FE |

Job đối soát đề xuất mỗi 15–30 phút nếu gói hosting cho phép; nếu lịch job trên Vercel không đáp ứng, dùng scheduler Supabase hoặc job riêng. Có kiểm tra thủ công qua công cụ nội bộ để hỗ trợ trước khi job chạy. Đây là quy trình do dự án chọn; không phụ thuộc giả định SePay luôn retry trong một khoảng thời gian cố định. [SePay hướng dẫn bảo mật và đối soát](https://developer.sepay.vn/vi/sepay-webhooks/bao-mat).

## 12. Supabase: dữ liệu và API

Supabase chỉ giữ commerce/quyền mua; câu hỏi tiếp tục nằm trong JSON. Backend truy cập DB bằng credential server; browser không ghi trực tiếp bảng order/entitlement. Nếu các bảng thuộc schema exposed, bật RLS và không cấp quyền đọc/ghi công khai; service credential chỉ ở backend. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

| Bảng             | Trường chính / ràng buộc                                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `guest_sessions` | `id`, `token_hash UNIQUE`, `created_at`, `expires_at`                                                                                                                                   |
| `products`       | `id`, `pack_id UNIQUE`, `price_vnd INTEGER > 0`, `price_version`, `active`                                                                                                              |
| `orders`         | `id UUID`, `guest_id`, `product_id`, `pack_id`, `amount_vnd`, `currency=VND`, `title_snapshot`, `price_version`, `payment_code UNIQUE`, `status`, `expires_at`, `created_at`, `paid_at` |
| `order_requests` | `(guest_id, idempotency_key) UNIQUE`, `order_id`; bảo vệ retry tạo đơn                                                                                                                  |
| `payment_events` | `provider`, `provider_transaction_id`, `order_id nullable`, `amount`, `received_at`, `bank_transaction_at`, `processing_status`; `UNIQUE(provider, provider_transaction_id)`            |
| `purchases`      | `id`, `order_id UNIQUE`, `pack_id`, `status`, `recovery_hash UNIQUE`, `recovery_ciphertext`, `created_at`                                                                               |
| `entitlements`   | `id`, `guest_id`, `purchase_id`, `pack_id`, `granted_at`, `revoked_at`; `UNIQUE(guest_id, purchase_id)`                                                                                 |
| `audit_events`   | Thay đổi trạng thái, hoàn tiền, khôi phục, đối soát; không chứa secret                                                                                                                  |

Quyền effective của guest là tập pack có purchase active và entitlement chưa revoked. Khôi phục tạo entitlement từ cùng purchase; hoàn tiền purchase thu hồi tất cả các grant liên quan. Không xóa order/event khi hoàn tiền.

### Hợp đồng API tối thiểu

| Endpoint                         | Input                         | Output / điều kiện                                                           |
| -------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `POST /api/session`              | Không cần thông tin cá nhân   | Set cookie khách, idempotent nếu session còn hợp lệ                          |
| `GET /api/products/:packId`      | Pack ID                       | Giá, currency, priceVersion, active                                          |
| `POST /api/orders`               | `{packId}`, `Idempotency-Key` | Đơn + QR + giá snapshot hoặc trạng thái đã sở hữu; cần cookie                |
| `GET /api/orders/:orderId`       | Cookie sở hữu                 | `pending/paid/expired/review_required/refunded`; không lộ đơn guest khác     |
| `GET /api/entitlements`          | Cookie                        | Danh sách pack đã mua, metadata tối thiểu và thông tin khôi phục thuộc guest |
| `POST /api/entitlements/restore` | `{recoveryCode}` + cookie     | Cấp quyền trên thiết bị hiện tại hoặc lỗi chung                              |
| `POST /api/webhooks/sepay`       | Raw body + xác thực SePay     | Ack protocol sau commit hoặc mã lỗi thích hợp                                |

Chọn mã lỗi nhất quán: 400 dữ liệu sai, 401 session/xác thực thiếu, 404 tài nguyên không tồn tại hoặc không thuộc guest, 409 trạng thái xung đột, 429 giới hạn tần suất, 503 phụ thuộc tạm lỗi. API trạng thái không trả raw dữ liệu ngân hàng. Mã khôi phục chỉ trả cho người sở hữu qua kết nối HTTPS và response no-store.

## 13. PWA và offline

- Manifest: tên, short name, `id`, `start_url: /vi`, `scope: /`, `display: standalone`, theme/background colors, icon 192/512 và maskable; thêm apple touch icon. HTTPS production.
- Service worker cache app shell và bộ đang tải; không precache mọi bộ premium chỉ vì đã public.
- Cài app là gợi ý sau khi người dùng đã chơi vài câu hoặc qua menu. Trình duyệt không có install prompt thì hiển thị hướng dẫn theo nền tảng. Manifest và hướng dẫn cài là thành phần riêng với offline cache. [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).
- Free đã tải: chơi offline đầy đủ. Premium đã mua và đã đồng bộ quyền/tải nội dung: tiếp tục offline. Premium chưa mua: chỉ tập trial; mua mới cần mạng.
- Cần có cả HTML/JS của route chơi và JSON để hiển thị “Sẵn sàng offline”; tải riêng JSON chưa đủ. Cold start PWA vào `/vi` khi mất mạng phải mở được thư viện đã tải.
- Route chưa cache: hiển thị fallback offline với danh sách bộ có sẵn. Không hiện lỗi trắng hoặc giả rằng tất cả bộ đều có thể chơi.
- Không cache API payment, response chứa credential, QR/order status. Offline quyền lưu riêng ở client theo trade-off đã chấp nhận.
- Worker mới ở trạng thái waiting: báo “Có phiên bản mới”; chỉ reload khi người dùng đồng ý hoặc sau khi kết thúc ván. Không `skipWaiting` + reload giữa thanh toán.
- IndexedDB schema có version/migration. Cache cleanup giữ file mà ván đang sử dụng; khi thiếu storage báo lỗi nhẹ và vẫn cho chơi online.
- Khi browser xóa dữ liệu thì nội dung offline và quyền local mất; có thể tải/khôi phục lại. Không hứa offline vĩnh viễn.

## 14. SEO và GEO

SEO là khả năng được crawl/index và phục vụ đúng intent; GEO ở đây là tăng độ rõ ràng, hữu ích và khả năng được hệ thống tìm kiếm AI trích dẫn. Không cam kết thứ hạng hoặc được AI đề cập.

### SEO kỹ thuật

- HTML SSG có H1, mô tả category/pack, mẫu câu, hướng dẫn và liên kết ngay cả khi tắt JavaScript.
- Title/description riêng từng URL; canonical tuyệt đối theo domain production; `html lang="vi"`, Open Graph và ảnh chia sẻ có kích thước khai báo.
- Sitemap chỉ URL canonical indexable, không route chơi/checkout/khôi phục/API. `lastmod` phản ánh lần sửa nội dung thật, không tự đổi mỗi deploy.
- Noindex cho shell tiện ích và staging. Không chặn robots các URL cần crawler đọc noindex. Không đưa order ID hoặc recovery token vào sitemap/share link.
- JSON nội dung không phải landing page SEO; có thể đặt `X-Robots-Tag: noindex` trên response JSON để ưu tiên HTML, không xem đó là biện pháp bảo vệ câu hỏi.
- URL slug ASCII ổn định; slug đổi có 301; unknown pack trả 404 thật. Nếu thêm ngôn ngữ mới phải có bản dịch thật trước khi thêm hreflang hai chiều.
- Structured data `WebSite`, `BreadcrumbList`, `CollectionPage`/`ItemList` đúng trang; `SoftwareApplication` trên trang ứng dụng nếu mô tả đúng thực tế. Không rating/review giả. Không đặt Offer có giá SSG cũ nếu giá sản phẩm thay đổi độc lập.
- Đo Search Console, sitemap, coverage và internal links. Các checklist là tiêu chí dự án dựa trên nguyên tắc SEO cơ bản, không bảo đảm rich results. [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

### Nội dung để hỗ trợ GEO

Mỗi trang pack nên trả lời rõ: bộ dành cho ai, số câu, số người gợi ý, miễn phí hay trả phí, cách thử/mua và ví dụ. Viết đoạn trả lời ngắn ở đầu trước chi tiết; bảng so sánh free/premium thống nhất với sản phẩm. Bài hướng dẫn có tác giả/đơn vị biên tập, ngày cập nhật thật và liên kết đến bộ phù hợp.

Các chủ đề đề xuất: “Thật hay Thách là gì?”, “Cách chơi cho nhóm bạn”, “Cách chọn câu hỏi phù hợp”, “Chơi không cần tải app”, “Mua rồi đổi điện thoại thế nào?”. Tạo nội dung có ích, không sinh hàng trăm trang gần giống nhau chỉ để phủ từ khóa.

Về Google AI Overviews/AI Mode, không có schema đặc biệt hoặc file AI bắt buộc; nền tảng SEO và nội dung có thể truy cập vẫn là cơ sở. `llms.txt` là tùy chọn thử nghiệm, không là tiêu chí release hoặc lời hứa tăng trích dẫn. Structured data phải khớp nội dung nhìn thấy. [Google AI features and your website](https://developers.google.com/search/docs/appearance/ai-features).

### Bộ năng lực / skill khi triển khai

| Công việc                        | Skill hoặc checklist cần có                                                       |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Next.js SSG / metadata / routes  | `vercel:nextjs`                                                                   |
| CDN, version nội dung và headers | `vercel:cdn-caching`                                                              |
| Component và hiệu năng React     | `vercel:react-best-practices` khi triển khai UI                                   |
| Browser/PWA/flow thực tế         | `vercel:agent-browser`, `vercel:verification` khi triển khai và kiểm tra          |
| SEO kỹ thuật + biên tập + GEO    | Checklist chuyên biệt `seo-geo-checklist.md` đi kèm, dựa trên tài liệu chính thức |

Trong phiên hiện tại không có skill riêng mang tên SEO/GEO. Spec cung cấp checklist đầy đủ để thực thi và nghiệm thu; không giả định đã cài thêm skill hoặc plugin nào. Nếu sau này cần đóng gói thành Codex skill tái sử dụng, dùng checklist này làm đầu vào.

## 15. Hiệu năng và analytics

### Mục tiêu nghiệm thu

- Core Web Vitals ở p75 dữ liệu người dùng thực: LCP ≤2,5 giây, INP ≤200ms, CLS ≤0,1. Giai đoạn chưa đủ traffic dùng lab mobile làm tín hiệu, không gọi điểm lab là field data. [Web Vitals](https://web.dev/articles/vitals).
- Chuyển câu không gọi mạng; phản hồi thị giác trong khoảng 100ms, animation hoàn tất dưới 250ms trên thiết bị thử nghiệm.
- Route chơi tránh tải thư viện thanh toán/analytics nặng; QR chỉ tải khi checkout. Dùng font được tối ưu, không tải mọi pack ngay trang chủ.
- Sau khi DB commit paid, UI foreground nhận mở khóa trong hai chu kỳ polling bình thường. Thời gian ngân hàng/SePay gửi webhook là độ trễ bên ngoài, không cam kết con số tuyệt đối.
- Bộ đã cache chạy khi API/Supabase tạm lỗi; không khóa nhầm người đã mua do request kiểm tra quyền tạm thời thất bại.

### Event tối thiểu

`category_view`, `pack_view`, `game_start`, `question_revealed`, `trial_exhausted`, `paywall_view`, `checkout_created`, `payment_confirmed`, `unlock_success`, `purchase_restored`, `offline_play`, `pwa_install` nếu nền tảng quan sát được.

Chỉ gửi pack/type/tier, trial count, session analytics ngẫu nhiên, trạng thái và thời lượng cần thiết. Không thu câu trả lời người chơi, tên người chơi, cookie token, mã khôi phục hoặc raw webhook. Event thanh toán chuẩn phát từ backend với order ID dùng để dedupe, không ghi doanh thu từ click nút.

Dashboard: pack view → trial start → trial exhausted → paywall → checkout → paid; median thời gian chờ, lỗi QR, paid nhưng chưa mở khóa, restore success. Tách conversion của người đã chạm paywall và của toàn bộ người thử.

Sau khi có traffic đủ để so sánh, thử 5/8/10 câu bằng thiết kế thí nghiệm nhất quán; theo dõi cả doanh thu và mức rời bỏ. MVP dùng một giá trị 8, chưa xây hệ thống experiment phức tạp.

## 16. Acceptance criteria

| ID         | Kịch bản                               | Kết quả bắt buộc                                                 |
| ---------- | -------------------------------------- | ---------------------------------------------------------------- |
| GAME-01    | Chọn bộ free                           | Chơi được không cookie/session API và không login                |
| GAME-02    | Rút câu cùng loại                      | Không lặp đến khi hết hàng đợi                                   |
| GAME-03    | Double tap / reload                    | Không tăng hai lượt ngoài ý định; reload giữ câu                 |
| GAME-04    | Hết một loại                           | Thông báo và chuyển lựa chọn rõ ràng, không crash                |
| TRIAL-01   | Chọn premium                           | Chỉ 8 ID trial, đúng 4/4 trước mở khóa                           |
| TRIAL-02   | Chọn Thật lần thứ 5                    | Gợi ý thử Thách hoặc mở khóa, không lấy câu thứ 5 ngoài trial    |
| TRIAL-03   | Đã xem câu thứ 8                       | Vẫn đọc được; thao tác rút tiếp mới yêu cầu mua                  |
| TRIAL-04   | Refresh/đổi ván/quay lại               | Không có câu trial mới ngoài tập preview                         |
| BUY-01     | Sửa giá trong request                  | Server bỏ qua giá client, tính từ product                        |
| BUY-02     | Bấm mua lặp hoặc API retry             | Một đơn hiệu lực/idempotency key; không nhân đôi QR ngoài ý định |
| PAY-01     | Webhook hợp lệ, tiền đúng              | Một paid order và một purchase, mở khóa pack đúng                |
| PAY-02     | Gửi cùng event nhiều lần/song song     | Không tạo quyền hoặc doanh thu trùng                             |
| PAY-03     | Webhook giả/sai tài khoản/sai mã       | Không tự cấp quyền                                               |
| PAY-04     | DB lỗi giữa event và entitlement       | Rollback, lần retry có thể hoàn tất                              |
| PAY-05     | Thiếu/thừa tiền hoặc chuyển trễ        | Đi đúng chính sách review/cửa sổ thanh toán                      |
| PAY-06     | Đóng tab hoặc chuyển app ngân hàng     | Paid vẫn ghi nhận; quay lại refresh và chơi tiếp                 |
| PAY-07     | Biết UUID đơn người khác               | Không đọc được trạng thái hoặc recovery code                     |
| RESTORE-01 | Thiết bị mới nhập mã đúng              | Có quyền mua, không cần tài khoản                                |
| RESTORE-02 | Nhập mã sai/rate limit                 | Thông báo chung, không lộ thông tin đơn                          |
| PWA-01     | Cài và cold start offline sau tải      | Mở được shell, danh sách đã tải và bộ đã tải                     |
| PWA-02     | Offline lúc checkout                   | Không tạo/xác nhận giả; tiếp tục kiểm tra khi có mạng            |
| PWA-03     | Deploy khi đang chơi                   | Không reload mất tiến độ hoặc thay nội dung giữa ván             |
| CDN-01     | Version mới và catalog cũ cùng tồn tại | Cả ván cũ và ván mới tải được file phù hợp                       |
| SEO-01     | Tắt JS/xem raw HTML                    | Nội dung giới thiệu, metadata và liên kết có sẵn                 |
| SEO-02     | Kiểm tra sitemap/canonical/noindex     | Chỉ URL nội dung đúng xuất hiện trong sitemap                    |
| UI-01      | 320px, 390px, tablet, desktop          | Không tràn ngang/cắt câu; QR và nút dùng được                    |
| A11Y-01    | Keyboard/screen reader/reduced motion  | Chơi, checkout và đóng modal sử dụng được                        |

Test trên Safari iOS, Chrome Android, Chrome/Safari desktop và chế độ PWA standalone. Thanh toán test với payload mô phỏng, lỗi mạng, replay đồng thời; trước production thực hiện giao dịch thật giá nhỏ theo quy trình của chủ dự án, đối chiếu từ tiền vào đến entitlement. Không tự thực hiện chuyển tiền trong giai đoạn viết spec.

## 17. Kế hoạch triển khai và vận hành

1. **Nền tảng nội dung/UI:** validate JSON, routing SSG, design tokens, free game, lưu tiến độ, màn trạng thái.
2. **Premium:** tập trial, paywall, sản phẩm/giá, guest session, Supabase schema và API.
3. **Thanh toán:** QR, webhook, transaction/idempotency, polling, restore và xử lý ngoại lệ.
4. **PWA + SEO/GEO:** offline thật, update flow, metadata, sitemap, nội dung HTML, checklist đi kèm.
5. **Nghiệm thu:** E2E trên mobile, đối soát, production headers, đo hiệu năng, analytics và launch.

Trước launch cần có: brand/domain; danh sách pack và số câu thật; xác nhận chính sách 30.000đ/bộ và quyền có hạn 7 ngày; tài khoản ngân hàng/SePay hoạt động; secret webhook; Supabase/Vercel env; kênh hỗ trợ thật; chính sách thanh toán/hoàn tiền hiển thị; người phụ trách xử lý giao dịch không khớp. Đây là đầu vào triển khai, không chặn việc dùng spec hiện tại để thiết kế và chia task.

Vận hành: sửa nội dung bằng PR → schema/content review → build → preview → deploy; đổi giá qua quyền admin và rebuild thông tin SSG nếu cần. Theo dõi webhook lỗi, paid chưa cấp quyền, unmatched và đối soát; giữ audit khi thao tác hỗ trợ. Không lưu raw thông tin ngân hàng lâu hơn nhu cầu đối soát đã xác định.

## 18. Các quyết định mở để chủ sản phẩm điều chỉnh

| Mục                     | Mặc định đề xuất trong spec                                    |
| ----------------------- | -------------------------------------------------------------- |
| Phạm vi 30.000đ         | Một bộ premium, có hạn 7 ngày                                  |
| Trial                   | 8 câu cố định/bộ, chia 4/4                                     |
| Chuyển thiết bị         | Mã khôi phục, không giới hạn số thiết bị ở MVP                 |
| Nội dung sau mua        | Cập nhật cùng pack được bao gồm; pack mới bán riêng            |
| Thời hạn checkout       | 15 phút; đối chiếu tự động giao dịch đúng trong 24h từ lúc tạo |
| Thiếu/thừa/sai nội dung | Review và hỗ trợ thủ công                                      |
| Nội dung 18+            | Chưa có trong MVP mặc định                                     |
| Admin                   | Git + Supabase nội bộ, chưa làm dashboard                      |

Các giá trị này phải nằm trong config/rule rõ ràng, không rải hardcode vào component. Đổi trial phải đồng bộ tập preview; đổi giá chỉ cần nguồn giá backend, đồng bộ lại giá giới thiệu nếu có.
