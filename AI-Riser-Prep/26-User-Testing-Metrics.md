# 26 — Kế hoạch người dùng thật & Số liệu (v1)

> **Đây là yếu tố quyết định lên Gold/Platinum.** BTC nói thẳng: *"Applications with active user engagement will have a significant advantage. Please collect data/insights/stories as proof and submit it in the submission form"* ([02](02-Cham-diem-va-giai-thuong.md)).
> Rất nhiều đội sẽ nộp app chạy được nhưng **không có người dùng thật** → đây là chỗ tạo khoảng cách.

## 1. Mục tiêu (đề xuất — 🔲 Thanh chốt)

| Chỉ tiêu | Mức tối thiểu | Mức tốt |
|---|---|---|
| Gia đình dùng thật | 5 | **15–20** |
| Người được chăm sóc (ba mẹ) thật sự nhận nhắc | 3 | 10+ |
| Đơn thuốc thật được xử lý | 15 | 50+ |
| Ngày chạy liên tục có dữ liệu | 5 | 10+ |
| Câu chuyện/trích dẫn người dùng | 3 | 8+ |

> Không cần con số lớn. **5 gia đình dùng thật trong 10 ngày, có câu chuyện cụ thể** thuyết phục hơn "1000 lượt đăng ký" nhiều.

## 2. Nguồn người dùng (theo thứ tự dễ → khó)

| Vòng | Nguồn | Cách tiếp cận |
|---|---|---|
| **V1 — ngày 1–2** | **Chính gia đình Thanh** | Người dùng số 0. Đây cũng là nguồn câu chuyện thật nhất cho video demo |
| V2 — ngày 2–5 | Bạn bè có ba mẹ lớn tuổi / có bệnh mãn tính | Nhắn riêng, hướng dẫn tận tay 1-1. **Đích thân cài giúp** — đúng luồng onboarding thật (con cái setup hộ) |
| V3 — ngày 4–8 | Đồng nghiệp, người quen ở quê | Nhờ họ cài cho ba mẹ, mình hỗ trợ qua video call |
| V4 — ngày 6–12 | Hội nhóm Facebook: chăm sóc cha mẹ, bệnh tiểu đường/huyết áp, hội đồng hương | Đăng bài kể chuyện (không quảng cáo), mời dùng thử miễn phí |
| V5 | Cộng đồng AI Riser (Slack) | Vừa lấy user, vừa lấy feedback kỹ thuật |

**Nguyên tắc:** ưu tiên **chiều sâu hơn số lượng** — 1 gia đình dùng đủ 10 ngày > 20 người đăng ký rồi bỏ.

## 2b. 📱 Thiết bị test — Thanh dùng iPhone thì làm sao? (11/08)

**Bối cảnh:** AI Studio build **app Android** (không có iOS). Thanh dùng iPhone.

| Vai trò | Thiết bị cần | Ghi chú |
|---|---|---|
| **Web (con cái)** | Bất kỳ — iPhone/Mac đều được | ✅ Không vướng gì. Phần lớn công việc phát triển nằm ở đây |
| **App (ba mẹ)** | **Bắt buộc có Android thật** | Xem phương án bên dưới |

**Phương án theo thứ tự nên dùng:**

| # | Cách | Được gì | Không được gì |
|---|---|---|---|
| 1 | **Android Emulator** (Android Studio trên Mac, miễn phí) | Vòng lặp phát triển hằng ngày: giao diện, luồng, logic | ❌ **Không test được T22** (OEM giết tiến trình nền) vì emulator là Android gốc |
| 2 | ⭐ **Mượn điện thoại Android của người thân/bạn** — dùng cả tháng | Test thật, kể cả T22 qua đêm | Cần mượn dài ngày |
| 3 | ⭐⭐ **Chính điện thoại của các gia đình dùng thử** | Đúng thiết bị thật, đúng hoàn cảnh thật — **vừa test vừa lấy người dùng** | Phải chờ có người dùng thử |
| 4 | **Firebase Test Lab** | Chạy trên **máy thật trên đám mây** (có cả Xiaomi/Oppo/Samsung), có gói miễn phí | Không test được kịch bản qua đêm dài |

**Khuyến nghị:**
- Ngày thường: **emulator** để làm nhanh.
- **Mượn 1 máy Android thật ngay từ đầu** — bắt buộc, vì: ① test T22 (nhắc thuốc có đến không) là bài test sống còn ② **quay video demo cần cảnh điện thoại thật**.
- Ưu tiên mượn máy **Xiaomi/Oppo/Vivo** (khó nhất về tối ưu pin) hơn là Samsung/Pixel.
- Người dùng thật ở VN: người lớn tuổi gần như toàn dùng Android → **các gia đình dùng thử chính là dàn thiết bị test**.

> ⚠️ **Việc cần làm ngay:** hỏi mượn 1 máy Android cho cả tháng 8. Đây là phụ thuộc phần cứng duy nhất của dự án.

## 3. Số liệu cần đo (in-app analytics)

**Nhóm A — Chứng minh có người dùng thật**
- Số gia đình tạo · số thành viên · số người quản lý/gia đình
- Số ngày hoạt động liên tục · retention D1/D3/D7
- Số đơn thuốc xử lý · số thuốc trong hệ thống

**Nhóm B — Chứng minh sản phẩm hoạt động** (mạnh nhất khi pitch)
- **Số liều được nhắc** và **tỉ lệ xác nhận đã uống** ← con số vàng
- Tỉ lệ uống đúng giờ trước/sau khi dùng app (hỏi người dùng ước lượng trước đó)
- Số cảnh báo tương tác thuốc & kiêng ăn đã đưa ra
- Số lần dùng trợ lý giọng nói
- Số đợt thuốc kết thúc đúng hạn (M18 hoạt động)

**Nhóm C — Chứng minh chất lượng AI**
- **Độ chính xác trích xuất** trên golden set ([25](25-AI-Prompts.md) mục 7)
- Tỉ lệ trường phải sửa tay ở màn xác nhận
- **Tỉ lệ cache hit** → minh chứng cho luận điểm "càng đông càng rẻ" ([22](22-Business-Model.md))

**Nhóm D — Cảm xúc (định tính)**
- Số lần bấm "Báo con: ba mẹ ổn" ← chỉ số cảm xúc thuần túy, rất dễ kể chuyện
- Trích dẫn nguyên văn của người dùng

> ⚠️ Analytics phải **ẩn danh & tổng hợp** — không log nội dung y tế ([23](23-Security-Privacy.md)).

## 4. Thu thập câu chuyện (phần dễ bị bỏ quên nhưng ăn điểm nhất)

**Cách làm:** sau 3–5 ngày dùng, nhắn hỏi 3 câu ngắn:
1. *"Trước khi có app, anh/chị lo nhất điều gì về việc uống thuốc của ba mẹ?"*
2. *"Có khoảnh khắc nào app giúp được không? Kể cụ thể giúp em."*
3. *"Nếu app biến mất ngày mai, anh/chị có tiếc không? Vì sao?"*

**Cần thu:**
- [ ] Ảnh chụp màn hình thật (che thông tin cá nhân)
- [ ] Trích dẫn nguyên văn (xin phép trước khi dùng trong bài nộp)
- [ ] 1–2 gia đình đồng ý **xuất hiện trong video demo** (kể cả chỉ giọng nói)
- [ ] **Văn bản đồng ý** đơn giản qua tin nhắn: "Em xin phép dùng câu này và ảnh màn hình (đã che tên) trong bài dự thi nha" → giữ lại ảnh chụp tin nhắn

## 5. Vòng lặp phản hồi
- Nút **"Góp ý"** ngay trong app (web + mobile) → ghi vào Firestore, xem được ở dashboard riêng.
- Ghi lại **mọi trường hợp trích xuất sai** kèm ảnh (có sự đồng ý) → sửa prompt → chạy lại golden set.
- Mỗi 2 ngày: đọc feedback, chọn **1 việc sửa** ảnh hưởng lớn nhất, làm ngay.

## 6. Lịch triển khai (khớp workflow [16](16-HANDOFF-Antigravity.md))

| Ngày | Việc |
|---|---|
| Ngay khi có bản chạy được | Cài cho **gia đình mình** trước tiên |
| +2 ngày | Mời 3–5 gia đình bạn bè, cài tận tay |
| +4 ngày | Đăng bài kể chuyện lên nhóm cộng đồng |
| Hằng ngày | Xem dashboard số liệu, ghi bất thường |
| 3 ngày trước hạn nộp | **Chốt số liệu**, phỏng vấn xin câu chuyện & đồng ý |
| 2 ngày trước | Đưa số liệu + trích dẫn vào form nộp & video |

## 7. Cách trình bày trong bài nộp (mẫu)
> *"Trong 12 ngày, {N} gia đình đã dùng {tên app} với {M} người thân lớn tuổi. Hệ thống xử lý {X} đơn thuốc thật, gửi {Y} lượt nhắc, và {Z}% số liều được xác nhận đã uống. Độ chính xác trích xuất đạt {A}% trên bộ kiểm thử {B} đơn thuốc thật. Bác {tên}, 68 tuổi ở {nơi}, nói: '{trích dẫn}'."*

Con số + câu nói thật = thứ giám khảo nhớ. 🔲 Điền khi có dữ liệu.
