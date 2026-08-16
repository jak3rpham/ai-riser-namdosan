# 45 — Kịch bản video dự thi (90 giây)

> Định dạng: **commercial giới thiệu sản phẩm** — vừa thao tác giao diện thật, vừa
> giải thích nguyên lý, vừa nói được positioning và sứ mệnh.
> Nộp: YouTube công khai, **tối đa 2 phút** ([09](09-Nop-bai-Checklist.md)). Bản này dài **90 giây**.

---

## Ràng buộc trước khi viết một chữ nào

**Ngân sách lời thoại: ~200 từ.** Giọng đọc tiếng Việt ấm, không gấp, rơi vào
130–145 từ/phút. 90 giây = 195–215 từ. Viết dài hơn là phải đọc nhanh, mà đọc
nhanh thì mất hẳn chất "cháu nói với bác" — thứ làm nên tông của app này.

**Không được có trong video:**
- Số liệu không có thật ("giảm 40% quên thuốc", "hàng nghìn gia đình")
- Lời chứng thực của người dùng không tồn tại
- Bất kỳ câu nào nghe như chẩn đoán hay tư vấn liều
- Mã mời, email, khoá API lọt vào khung hình

**Bắt buộc phải có:** ít nhất một cảnh cho thấy Google Calendar hoặc Tasks có
sự kiện thật do app tạo. Đây là bằng chứng tích hợp, và nó chỉ quay được bằng
tài khoản Google thật — tài khoản dùng thử `/demo` không làm được.

---

## Bảng màu & chất liệu (lấy từ `src/index.css`, không phỏng đoán)

| Vai trò | Giá trị |
|---|---|
| Nhấn chính | `#FF6B4B` → `#FF8E53` (gradient 135°) |
| Nền | `#F5F7FB` |
| An toàn / xác nhận | `#059669` |
| Cảnh báo | `#D97706` |
| Chữ đậm | `#0F172A` |
| Chữ phụ | `#475569` |
| Bo góc | 12 / 18 / 26 px |
| Chất liệu thẻ | kính mờ, viền trắng 85%, bóng đổ mềm |

Mọi cảnh 3D phải nằm trong bảng này. Lệch màu là ghép vào thấy ngay.

---

## KỊCH BẢN

### 0:00 – 0:09 · Hook
**Hình:** 3D. Một căn phòng nhỏ về đêm, ánh đèn ấm. Trên bàn: vỉ thuốc bóc dở,
ly nước còn đầy. Camera đẩy chậm vào vỉ thuốc. Không có chữ.
Cắt nhanh: màn hình điện thoại sáng lên trong bóng tối, tin nhắn "Ba uống thuốc chưa ạ?"

**Lời:**
> Ba mẹ mình uống bốn, năm loại thuốc mỗi ngày.
> Còn mình thì ở xa, chỉ biết nhắn tin hỏi.

---

### 0:09 – 0:16 · Tên & định vị
**Hình:** 3D. Icon Nhà Mình (mái nhà + trái tim) dựng lên từ nét, nền `#F5F7FB`.
Tên app hiện dưới.

**Lời:**
> Nhà Mình — để cả nhà uống thuốc đúng giờ, đúng liều.

---

### 0:16 – 0:34 · Chụp đơn thuốc *(quay màn hình thật)*
**Hình:** Tay cầm điện thoại chụp một tờ đơn thuốc thật. Cắt sang màn hình app:
Gemini đọc ra từng dòng thuốc, từng dòng hiện dần. Ngón tay chạm vào một dòng
để sửa tên thuốc → dòng đó đổi trạng thái sang "đã xác nhận".

**Lời:**
> Chụp tờ đơn. AI đọc tên thuốc, liều, giờ uống.
> Rồi con kiểm lại từng dòng trước khi lưu.
> AI đề xuất — người xác nhận.

**Ghi chú quay:** phải quay đúng thao tác sửa một dòng. Đây là chỗ nói lên
nguyên lý an toàn của cả sản phẩm, không được lướt qua.

---

### 0:34 – 0:50 · App của ba mẹ *(quay màn hình thật)*
**Hình:** Đổi sang điện thoại thứ hai, giao diện ba mẹ. Chữ to, nút to.
Thẻ "Sáng — Amlodipine" nổi lên. Ngón tay cái bấm nút "Đã uống".
Nút chuyển xanh `#059669`.

**Lời:**
> Tới giờ, ba mẹ chỉ thấy đúng một việc cần làm.
> Chữ to, một nút.

---

### 0:50 – 1:02 · Hai máy nối nhau *(quay màn hình thật, split screen)*
**Hình:** Trái: máy ba mẹ vừa bấm xong. Phải: máy con, dòng sự kiện gia đình
hiện thêm một dòng **ngay lập tức**, không tải lại. Quay một lần, không cắt —
để thấy rõ là realtime thật.

**Lời:**
> Con ở xa biết ngay, không phải nhắn hỏi nữa.

---

### 1:02 – 1:14 · Ranh giới an toàn *(quay màn hình thật)*
**Hình:** Màn hình "Hỏi cháu". Câu hỏi hiện ra: *"Bác quên uống thuốc huyết áp,
uống bù hai viên được không con?"* Trợ lý trả lời — quay đúng câu từ chối và
lời khuyên hỏi bác sĩ. Cắt sang thẻ cảnh báo tương tác thuốc màu `#D97706`.

**Lời:**
> Có những câu app không bao giờ trả lời.
> Không đổi liều, không chẩn đoán, không thay bác sĩ.
> Chỉ số huyết áp thì app tự đối chiếu ngưỡng, không để AI đoán.

**Ghi chú:** đây là đoạn khác biệt lớn nhất so với mọi app nhắc thuốc khác.
Nếu phải cắt bớt video, cắt chỗ khác, đừng cắt chỗ này.

---

### 1:14 – 1:24 · Nối vào đời sống *(quay màn hình thật)*
**Hình:** Ba nhịp nhanh, mỗi nhịp ~3 giây:
1. Lịch tái khám → mở **Google Calendar thật**, thấy sự kiện app vừa tạo
2. Sắp hết thuốc → **Google Tasks** hiện việc mua thuốc
3. Bản đồ nhà thuốc gần nhà, khoảng cách km

**Lời:**
> Lịch tái khám vào thẳng Google Calendar.
> Sắp hết thuốc thì nhắc mua.
> Cần gấp thì biết nhà thuốc nào gần nhất.

---

### 1:24 – 1:30 · Sứ mệnh & đóng
**Hình:** 3D. Icon Nhà Mình, tên app, đường link.
Dòng miễn trừ nhỏ ở dưới: *"App không chẩn đoán bệnh, không kê đơn."*

**Lời:**
> Nhà Mình. Để ở xa vẫn yên tâm.

---

## Tổng lời thoại: ~185 từ

Còn dư chỗ thở. Nếu quay xong thấy chật, cắt câu *"Chỉ số huyết áp thì app tự
đối chiếu ngưỡng"* — ý đó vẫn còn trong hai câu trước.

---

## Danh sách cảnh phải quay màn hình

> ⚠️ **Mục này đã lỗi thời — dùng [49](49-Kich-Ban-Quay-Man-Hinh.md).**
>
> Nó soạn khi app Con còn là một trang cuộn dài. App giờ có thanh điều hướng
> sáu mục, có màn "trong nhà mình bác là ai", và luồng triệu chứng đã khép
> vòng sang máy con cái. Quay theo bảng dưới sẽ ra những thao tác không còn
> tồn tại. Doc 49 còn ghi cảnh nào đã kiểm chạy được, cảnh nào chưa.

### (bản cũ, giữ để đối chiếu)

Dùng **tài khoản Google thật của m**, không dùng `/demo` — vì cần Calendar và Tasks.

| # | Màn hình | Thao tác | Chuẩn bị trước |
|---|---|---|---|
| 1 | Chụp đơn thuốc | Chụp → chờ đọc → sửa 1 dòng → lưu | Có sẵn một tờ đơn thuốc giấy, chữ rõ |
| 2 | App ba mẹ, tab Hôm nay | Bấm "Đã uống" | Đã có thuốc trong khung giờ đang quay |
| 3 | Split hai máy | Bấm ở máy A, quay phản ứng ở máy B | Hai máy cùng nhà, cùng đăng nhập sẵn |
| 4 | Hỏi cháu | Gõ câu hỏi uống bù 2 viên | — |
| 5 | Thẻ cảnh báo tương tác | Cuộn tới | Hồ sơ có cặp thuốc thật sự tương tác |
| 6 | Google Calendar | Đồng bộ → mở app Calendar | Đã cấp đủ quyền Calendar |
| 7 | Google Tasks | Mở app Tasks | Đã cấp quyền Tasks |
| 8 | Tìm nhà thuốc | Mở → cho phép vị trí | Bật GPS, đứng chỗ có nhà thuốc gần |

**Quay dọc 1080×1920**, 60fps nếu máy cho phép. Tắt thông báo. Bật chế độ
không làm phiền — một thông báo Zalo nhảy vào giữa khung hình là quay lại từ đầu.
Kiểm tra kỹ: **không có mã mời, email, hay tên người thật nào trong khung hình.**

---

## Bước tiếp theo

Asset 3D dựng theo đúng bảng màu và hình khối của app hiện tại (icon mái nhà +
trái tim, thẻ kính mờ, bo góc 26px). Làm từng asset rời trước, rồi mới đưa vào
công cụ sinh video kèm prompt chuyển động — cách này giữ được phong cách đồng
nhất giữa các đoạn, thay vì để AI tự nghĩ ra hình mỗi lần một kiểu.
