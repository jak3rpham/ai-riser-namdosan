# 49 — Kịch bản quay màn hình (theo app ngày 16/08/2026)

> Thay cho mục *"Danh sách cảnh phải quay màn hình"* của [45](45-Video-Script.md).
> Lời thoại, bảng màu và các cảnh 3D ở doc 45 vẫn dùng được.
>
> Vì sao cần viết lại: doc 45 soạn khi app Con còn là **một trang cuộn dài**.
> Giờ nó có thanh điều hướng sáu mục, có màn "trong nhà mình bác là ai", và
> luồng triệu chứng đã khép vòng sang máy con cái. Quay theo doc 45 sẽ ra
> những thao tác không còn tồn tại.

---

## 0. Chốt trước khi bấm quay

**Khung hình cuối là 16:9 ngang (1920×1080).** App Ba Mẹ là màn dọc, nên quay
dọc 1080×1920 rồi **ghép vào plate ngang** — xem
`demo-assets/video-assets/_plate-16-9/`, đã dựng sẵn đúng nền app. Đừng quay
dọc rồi kéo giãn cho vừa khung ngang.

**Dùng tài khoản Google THẬT, không dùng `/demo`.** Tài khoản demo cố tình
không nối được Calendar và Tasks — đó là giới hạn có chủ ý, không phải lỗi.
Hai cảnh Google bắt buộc phải quay bằng tài khoản thật.

**Không mở `?dev=1`.** Nó bật thanh công cụ dev ("Golden Set AI Metric", "Giả
lập Thông báo") — thứ giám khảo nhìn vào sẽ nghĩ sản phẩm chưa xong.

**Không để lọt vào khung hình:** mã mời, mật khẩu demo, email thật, tên người
thật. Mã mời hiện ở app Con → mục *Nhà mình*; tránh mục đó khi quay.

**Chuẩn bị hồ sơ trước.** Cần một hồ sơ có **Amlodipine + Atorvastatin** để ra
cảnh báo tương tác bưởi, và có **dị ứng Penicillin** khai sẵn. Không có cặp
thuốc đó thì cảnh 5 trống trơn.

**Giờ quay quyết định màn hình Ba Mẹ.** Thẻ thuốc chỉ hiện thuốc **chưa uống
và đã tới cữ**. Quay buổi sáng thì để thuốc cữ Sáng. Quay buổi tối mà thuốc
chỉ có cữ Sáng thì chấm Sáng vẫn cam (quá giờ chưa uống) — vẫn quay được,
nhưng nhớ **đừng bấm "đã uống"** ở buổi tập dượt, không thì lúc quay thật nó
đã xanh mất rồi.

---

## 1. Cảnh phải quay — 0:16 đến 1:24

### C1 · Quét đơn thuốc — 0:16 – 0:34 *(18 giây, dài nhất)*

| | |
|---|---|
| Màn hình | App Con → mục **Đơn thuốc** |
| Thao tác | Bấm **Scan / Tải ảnh lên** → chọn ảnh đơn → chờ Gemini đọc → sửa một dòng → **Xác nhận & Tạo lịch nhắc** |
| Cần thấy | Từng dòng thuốc hiện ra, ô **viền vàng** ở dòng AI đọc không chắc, con số `% chắc chắn`, rồi màn "Đã lưu đơn thuốc" |

Điểm bán hàng của cảnh này **không phải là AI đọc được**, mà là **app thừa
nhận nó có thể sai**: ô viền vàng, phần trăm chắc chắn, và người phải bấm xác
nhận. Cho khung hình dừng ở ô viền vàng khoảng 2 giây.

⚠️ **Chưa ai quay thử cảnh này với đơn thuốc thật.** Tập dượt trước bằng đúng
tờ đơn sẽ dùng. Nếu Gemini đọc ra rác thì đổi tờ đơn khác, đừng cố quay lại.

---

### C2 · Cảnh báo an toàn — 1:02 – 1:14

| | |
|---|---|
| Màn hình | App Con → mục **Tổng quan**, khối *Kiểm tra an toàn thuốc*; rồi mục **Kiêng ăn** |
| Thao tác | Chỉ cuộn và dừng lại |
| Cần thấy | Thẻ vàng *"Amlodipine 5mg — nên tránh Bưởi và nước ép bưởi"*, kèm dòng **Nguồn: Bảng tương tác thuốc–thức ăn trong kho kiến thức** |

Dòng "Nguồn:" là thứ đáng quay nhất trong cả video: nó cho thấy cảnh báo đến
từ **bảng tra cố định**, không phải từ model đoán. Đi kèm dòng *"chưa được
dược sĩ rà"* — **giữ nguyên, đừng cắt**. Thành thật về giới hạn là điểm cộng,
không phải điểm trừ.

Plate sẵn: `plate-05-kieng-an.png`.

---

### C3 · App của ba mẹ — 0:34 – 0:50

| | |
|---|---|
| Màn hình | `/parent`, tab **Hôm nay** |
| Thao tác | Bấm **✓ ĐÃ UỐNG RỒI** |
| Cần thấy | Nút đổi sang *"Con đang ghi lại..."* → pháo giấy → chấm cữ đổi **cam → xanh** → thẻ chạy sang thuốc cữ kế tiếp |

Quay **chậm và trọn vẹn** đoạn chấm đổi màu. Đó là bằng chứng app đọc dữ liệu
thật chứ không phải hoạt hình có sẵn.

Nếu hồ sơ chỉ có một loại thuốc, sau khi bấm sẽ hiện *"Hôm nay bác uống đủ
thuốc rồi ạ"* — cảnh đó cũng đẹp, dùng làm nhịp kết cho đoạn này.

Plate sẵn: `plate-01-hom-nay.png`.

---

### C4 · Hai máy nối nhau — 0:50 – 1:02

| | |
|---|---|
| Màn hình | Máy A: `/parent`. Máy B: app Con → **Tổng quan** |
| Thao tác | Bấm "đã uống" ở máy A, quay phản ứng ở máy B |
| Cần thấy | Dòng **ĐÃ UỐNG · Ba Mười · vừa xong** hiện ở máy B trong vài giây, **không tải lại trang** |

Hai máy phải cùng một nhà. Máy B mở sẵn mục Tổng quan trước khi bấm ở máy A.

**Nhịp mạnh hơn nếu có thời gian:** ở máy A vào tab *Hỏi cháu*, gõ
*"bác thấy chóng mặt"* → app chuyển sang bộ hỏi → chọn *Đầu · Vài ngày nay ·
Nhẹ · Không có gì kèm theo* → máy B hiện dòng **GHI NHẬN**. Cái này kể được
trọn câu chuyện "ở xa vẫn biết", mạnh hơn hẳn một liều thuốc.

Plate sẵn: `plate-03-hai-may.png`.

---

### C5 · Hỏi Cháu Bi bằng giọng nói — chèn vào 0:34 – 0:50

| | |
|---|---|
| Màn hình | `/parent` → tab **Hỏi cháu** → **Bấm vào đây rồi nói** |
| Thao tác | Nói: *"Thuốc huyết áp uống trước ăn hay sau ăn?"* |
| Cần thấy | Màn hình tối, vòng tròn to đang đập, **chữ hiện dần theo lời nói**, rồi câu trả lời — và **nghe được giọng đọc** |

Giọng Gemini TTS đã chạy (kiểm 16/08). **Quay có tiếng.** Đây là thứ khó tin
nhất khi chỉ đọc mô tả, mà nghe một câu là hiểu ngay.

⚠️ Nhận diện giọng nói cần **HTTPS** và chạy tốt nhất trên **Chrome**. Safari
iOS nhiều bản không có API này — thử trước trên đúng máy sẽ quay.

⚠️ Chưa ai quay thử phần nhận diện giọng nói tiếng Việt. Tập dượt trước; nếu
nó nghe sai nhiều quá thì chuyển sang gõ chữ, và cắt phần "nói" khỏi video.

Plate sẵn: `plate-02-man-nghe.png` — nền tối, tương phản mạnh nhất cả bộ.

---

### C6 · Google Calendar — 1:14 – 1:18

| | |
|---|---|
| Màn hình | App Con → **Nhà mình** → *Kết nối Google* → rồi mở **app Calendar thật** |
| Cần thấy | Sự kiện nhắc uống thuốc do app tạo, nằm trong Calendar thật |

Nối Google **trước khi quay**, đừng quay màn hình cấp quyền — nó dài, nhiều
chữ, và lộ email.

⚠️ Chưa kiểm lại trong phiên 16/08. Nối và tạo thử một lịch trước ngày quay.

---

### C7 · Google Tasks — 1:18 – 1:21

Mở app Tasks thật, thấy việc mua thêm thuốc do app tạo lúc lưu đơn.
Cùng cảnh báo như C6: chưa kiểm lại, phải thử trước.

---

### C8 · Nhà thuốc gần nhà — 1:21 – 1:24

| | |
|---|---|
| Màn hình | App Con → **Tìm nhà thuốc gần đây** |
| Cần thấy | Danh sách nhà thuốc thật kèm **khoảng cách km** |

✅ **Đã kiểm 16/08:** trả về 15 địa điểm thật quanh Q1 TPHCM từ OpenStreetMap,
gần nhất *Hiệu Thuốc Số 3 · 0,4 km*.

Cần cho phép truy cập vị trí — bật sẵn trước khi quay.

Nếu có chỗ nói: **không dùng Google Maps** vì Google không cấp Maps Platform
cho tài khoản Việt Nam, nên app chuyển sang OpenStreetMap. Đó là một quyết
định kỹ thuật thật, đáng một câu trong bài LinkedIn hơn là trong video 90 giây.

---

## 2. Thứ tự quay đề nghị

Không quay theo thứ tự video. Quay theo **trạng thái dữ liệu**, để không phải
dựng lại hồ sơ nhiều lần:

1. **C1** quét đơn thuốc — làm đầu tiên, vì nó tạo ra dữ liệu cho mọi cảnh sau
2. **C6, C7** Calendar và Tasks — ngay sau C1, lúc lịch vừa được tạo
3. **C2** cảnh báo an toàn — dữ liệu đã có đủ
4. **C8** nhà thuốc — độc lập, quay lúc nào cũng được
5. **C5** hỏi bằng giọng nói — trước C3, vì chưa cần thuốc đã uống
6. **C3, C4** bấm đã uống + hai máy — **quay cuối cùng**, vì bấm xong là
   trạng thái đổi và muốn quay lại phải chờ sang cữ khác hoặc sang hôm sau

---

## 3. Trạng thái từng cảnh — đọc trước khi lên lịch quay

| Cảnh | Đã kiểm chạy được? |
|---|---|
| C2 cảnh báo an toàn | ✅ kiểm 16/08 trên nhà thật |
| C3 bấm đã uống | ✅ kiểm 16/08, gồm cả chống bấm hai lần |
| C4 hai máy nối nhau | ✅ kiểm 16/08, cả liều thuốc lẫn dòng GHI NHẬN |
| C8 nhà thuốc gần nhà | ✅ kiểm 16/08, 15 kết quả thật |
| C5 giọng đọc của app | ✅ kiểm 16/08 — trả về audio thật 4 giây |
| C5 nhận diện giọng nói | ⚠️ **chưa ai thử** |
| C1 quét đơn thuốc thật | ⚠️ **chưa ai thử** — mới chỉ kiểm nhánh LỖI |
| C6 Google Calendar | ⚠️ **chưa kiểm lại** |
| C7 Google Tasks | ⚠️ **chưa kiểm lại** |

Bốn cảnh ⚠️ phải **tập dượt trước ngày quay**. Ba cảnh trong đó phụ thuộc dịch
vụ ngoài, hỏng lúc quay là mất cả buổi.

---

## 4. Cấu hình máy

- Tắt thông báo, bật *Không làm phiền*. Một tin Zalo nhảy vào là quay lại từ đầu.
- Pin trên 50%, hoặc giấu thanh trạng thái.
- Quay app Ba Mẹ ở **1080×1920**, 60fps nếu máy cho phép; ghép vào plate ngang.
- Quay app Con ở **1920×1080** hoặc lớn hơn, đừng phóng to trình duyệt quá 100%.
- Chuột di **chậm**. Chuột giật là dấu hiệu rõ nhất của một bản quay vội.
