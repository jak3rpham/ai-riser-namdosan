# 29 — Audit toàn bộ quy trình: Lỗi · Rò rỉ · Trùng lặp (v1)

> Yêu cầu Thanh: *"audit lại nguyên process, chỗ nào có khả năng bị lỗi, bị leak, rò rỉ hay overlapped thì note lại hết để test sau"*.
> Mỗi mục có **mã test (T##)** để Antigravity tick khi kiểm thử. Mức độ: 🔴 nguy hiểm cho người dùng · 🟠 hỏng dữ liệu/trải nghiệm · 🟡 phiền.

---

## GIAI ĐOẠN 1 — Thu nhận input

| Mã | Vấn đề | Hậu quả | Mức | Cách xử lý |
|---|---|---|---|---|
| T01 | Ảnh mờ/nghiêng/thiếu sáng | Trích xuất sai | 🟠 | Kiểm chất lượng ảnh phía client trước khi gửi |
| T02 | Chụp nhầm đơn của người khác | Sai hồ sơ, sai lịch | 🔴 | Màn xác nhận hiện **to** tên bệnh nhân trên đơn + chọn thành viên rõ ràng |
| T03 | Upload **cùng một đơn 2 lần** | Nhân đôi thuốc → **nhân đôi liều nhắc** | 🔴 | Hash ảnh + so khớp (bệnh nhân, ngày, danh sách thuốc) → cảnh báo *"Đơn này giống đơn đã nhập ngày X, có phải trùng không?"* |
| T04 | Đơn cũ đã hết hiệu lực | Nhắc uống thuốc không còn dùng | 🟠 | Đọc ngày trên đơn, quá cũ thì hỏi lại |
| T05 | File quá lớn / định dạng lạ | Lỗi, tốn băng thông | 🟡 | Giới hạn dung lượng & định dạng, nén phía client |

## GIAI ĐOẠN 2 — AI trích xuất

| Mã | Vấn đề | Hậu quả | Mức | Cách xử lý |
|---|---|---|---|---|
| T06 | Đọc sai **liều** hoặc **số lần/ngày** | Uống sai liều | 🔴 | Confidence từng trường + tô vàng + **bắt buộc xác nhận** |
| T07 | AI **bịa** tên thuốc không có trên đơn | Hồ sơ sai hoàn toàn | 🔴 | Rào an toàn "không chắc thì để null" ([25](25-AI-Prompts.md)); đối chiếu `name_as_written` với ảnh gốc luôn hiển thị cạnh nhau |
| T08 | Bỏ sót thuốc trong đơn nhiều loại | Thiếu thuốc | 🟠 | Hiện số thuốc đọc được + hỏi *"Đơn có đúng N loại không?"* |
| T09 | JSON trả về không hợp lệ | Luồng đứng | 🟡 | Retry 1 lần → chuyển nhập tay |
| T10 | Nhầm đơn vị (mg ↔ ml, viên ↔ gói) | Sai liều | 🔴 | Đơn vị luôn nằm nhóm bắt buộc xác nhận |
| T11 | Phân loại sai `course_type` | Nhắc mãi thuốc đợt, hoặc dừng sớm thuốc dài hạn | 🟠 | Hiển thị rõ ở màn xác nhận: *"Thuốc này uống 7 ngày rồi dừng — đúng không?"* |

## GIAI ĐOẠN 3 — Xác nhận & lưu

| Mã | Vấn đề | Hậu quả | Mức | Cách xử lý |
|---|---|---|---|---|
| T12 | Người dùng bấm xác nhận **cho có**, không đọc | Sai sót lọt lưới | 🟠 | Trường confidence thấp **bắt buộc chạm vào** mới cho qua; không cho "Xác nhận tất cả" khi có trường vàng |
| T13 | Gán đơn cho **sai thành viên** | Nhắc nhầm người | 🔴 | Chọn thành viên có **ảnh + tên to**; xác nhận lại ở bước cuối |
| T14 | Mất mạng giữa chừng | Mất dữ liệu đã nhập | 🟠 | Lưu nháp cục bộ, khôi phục khi mở lại |

## ⚠️ GIAI ĐOẠN 4 — TRÙNG LẶP (phần Thanh hỏi — nguy hiểm nhất)

| Mã | Vấn đề | Hậu quả | Mức | Cách xử lý |
|---|---|---|---|---|
| **T15** | ⭐ **Cùng hoạt chất dưới 2 biệt dược khác tên** (vd Panadol + Efferalgan đều là paracetamol; 2 bác sĩ kê 2 đơn) | **Quá liều** — người già tưởng là 2 thuốc khác nhau | 🔴☠️ | **Chuẩn hóa về hoạt chất** rồi so trùng → cảnh báo: *"Hai thuốc này cùng hoạt chất paracetamol. Bác hỏi lại bác sĩ trước khi uống cả hai nha."* → **Đây vừa là lỗi cần chặn, vừa là TÍNH NĂNG cứu mạng và điểm khác biệt** |
| T16 | Đợt thuốc cũ chưa kết thúc, đơn mới đã bắt đầu | Nhắc chồng, uống trùng | 🔴 | Khi thêm thuốc trùng hoạt chất đang active → hỏi *"Thay thuốc cũ hay uống thêm?"* |
| T17 | Nhiều thuốc trùng giờ nhắc | Dồn 5 thông báo lúc 7:00 | 🟡 | **Gộp thành 1 thông báo**: "Sáng nay bác uống 3 loại" — không bắn từng cái |
| T18 | Hai người quản lý **sửa cùng lúc** | Ghi đè nhau | 🟠 | Firestore transaction + hiện *"{tên} vừa cập nhật lúc {giờ}"*; nhật ký thay đổi |
| T19 | Bấm **"Đã uống" nhiều lần** | Đếm sai, log rác | 🟡 | Chống bấm lặp: 1 liều chỉ ghi 1 lần; bấm lại hiện "Bác xác nhận rồi ạ ✓" |
| T20 | Xác nhận hộ trên web + ba mẹ cũng bấm | Ghi 2 lần | 🟡 | Cùng khóa `liều+ngày`, ghi đè an toàn, ghi nguồn xác nhận |
| T21 | Trùng thành viên (thêm "Ba" 2 lần bởi 2 người con) | Hồ sơ phân mảnh | 🟠 | Cảnh báo trùng theo tên+năm sinh khi thêm |

## 🔴 GIAI ĐOẠN 5 — Nhắc thuốc (rủi ro kỹ thuật lớn nhất)

| Mã | Vấn đề | Hậu quả | Mức | Cách xử lý |
|---|---|---|---|---|
| **T22** | ⚠️ **Android OEM giết tiến trình nền** (Xiaomi/Oppo/Vivo/Samsung tối ưu pin rất "hăng" — cực phổ biến ở VN) | **Thông báo KHÔNG đến** → cả sản phẩm vô nghĩa | 🔴☠️ | ① Dùng **exact alarm** thay vì job có thể bị hoãn ② Trong lúc con cái setup: **xin miễn trừ tối ưu pin** + hướng dẫn tắt "hạn chế nền" cho app ③ **Bài test tự động ngay lúc onboarding**: đặt 1 nhắc thử sau 2 phút, con cái chờ nghe thấy mới coi là setup xong ④ Web cảnh báo nếu app ba mẹ **im lặng bất thường >24h** |
| T23 | Điện thoại hết pin / tắt nguồn | Không nhận nhắc | 🔴 | Phát hiện thiết bị không "báo sống" → cảnh báo cho con cái (không trách ba mẹ) |
| T24 | Chế độ im lặng / Không làm phiền | Không nghe thấy | 🟠 | Xin quyền báo thức ưu tiên; nhắc thuốc dùng kênh thông báo mức cao |
| T25 | Múi giờ / đổi giờ hệ thống | Nhắc sai giờ | 🟠 | Lưu giờ theo **giờ địa phương của người dùng**, tính lại khi đổi múi giờ |
| T26 | Mất mạng | Không nhận nhắc nếu phụ thuộc server | 🔴 | **Lịch nhắc lưu cục bộ trên máy** — không phụ thuộc mạng ([24](24-Scale-Cost-Control.md)) |
| T27 | Cài lại app / đổi máy | Mất kết nối gia đình | 🟠 | Con cái cấp lại link mời bất cứ lúc nào; dữ liệu vẫn ở Firestore |
| T28 | Nhắc tiếp sau khi đợt thuốc đã hết | Uống thừa | 🔴 | M18 vòng đời đợt thuốc: `end_date` tự dừng; test riêng ca "ngày cuối" |

## GIAI ĐOẠN 6 — Đồng bộ & hiển thị

| Mã | Vấn đề | Hậu quả | Mức | Cách xử lý |
|---|---|---|---|---|
| T29 | Web và app lệch dữ liệu | Con thấy "chưa uống" dù ba đã uống | 🟠 | Firestore realtime listener; hiện thời điểm cập nhật cuối |
| T30 | Doc tóm tắt dashboard cũ | Số liệu sai | 🟠 | Cập nhật summary bằng trigger, không tính lúc đọc |
| T31 | Calendar tạo sự kiện lặp vô hạn | Rác lịch Google của người dùng | 🟠 | Sự kiện đợt thuốc **luôn có ngày kết thúc**; xóa sự kiện khi xóa thuốc |
| T32 | Xóa thuốc nhưng lịch/nhắc còn | Nhắc thuốc không tồn tại | 🟠 | Xóa liên đới: thuốc → lịch → sự kiện Calendar → thông báo |

## 🔒 GIAI ĐOẠN 7 — Rò rỉ dữ liệu

| Mã | Vấn đề | Hậu quả | Mức | Cách xử lý |
|---|---|---|---|---|
| **T33** | Firestore rules chỉ kiểm `auth != null` | **Lộ dữ liệu mọi gia đình** | 🔴☠️ | Rules phạm vi gia đình + test Rules Playground ([23](23-Security-Privacy.md)) |
| **T34** | Dữ liệu bệnh nhân lọt vào `med_catalog` dùng chung | **Rò rỉ chéo giữa các gia đình** | 🔴 | Tách 2 lời gọi AI; kho chung chỉ chứa thông tin thuốc |
| T35 | Link mời bị chuyển tiếp | Người lạ vào được gia đình | 🔴 | Token **hết hạn 24h + dùng 1 lần** + hiện tên gia đình trước khi vào |
| T36 | Ảnh trong Storage để public | Lộ đơn thuốc (có tên, tuổi, chẩn đoán) | 🔴 | Rules phạm vi gia đình, signed URL ngắn hạn |
| T37 | Log ghi cả nội dung prompt/response | Lộ PII qua log | 🟠 | Chỉ log số token & metadata, không log nội dung |
| T38 | Người rời gia đình vẫn còn quyền | Xem lén sau khi đã ra | 🟠 | Thu hồi quyền ngay; kiểm tra quyền theo thời gian thực |
| T39 | Ảnh chụp màn hình chia sẻ nhầm | Lộ thông tin | 🟡 | Không hiện chẩn đoán chi tiết ở màn hình chính |

## GIAI ĐOẠN 8 — Trợ lý giọng nói

| Mã | Vấn đề | Hậu quả | Mức | Cách xử lý |
|---|---|---|---|---|
| T40 | Trả lời dựa trên hồ sơ **người khác** | Thông tin sai + rò rỉ | 🔴 | Context khóa cứng theo member đang đăng nhập trên máy đó |
| T41 | Bị dụ ra ngoài phạm vi (chẩn đoán, đổi liều) | Nguy hiểm | 🔴 | Rào an toàn trong system prompt; test bằng bộ câu hỏi "cố tình gài" |
| T42 | Nghe nhầm → trả lời sai thuốc | Nhầm lẫn | 🟠 | Nghe không rõ thì hỏi lại, không đoán |
| T43 | Không nhận ra tình huống cấp cứu | Chậm cứu | 🔴 | Từ khóa cấp cứu (đau ngực, khó thở, ngất) → khuyên gọi cấp cứu/người nhà ngay |

---

## ✅ Bộ test bắt buộc trước khi mời người dùng thật

**An toàn (không được phép fail):** T02 · T03 · T06 · T07 · T10 · T13 · **T15** · T16 · **T22** · T28 · **T33** · **T34** · T40 · T41 · T43

**Cách test T22 (quan trọng nhất về kỹ thuật):**
> Cài app lên **máy Android giá rẻ đời thật** (Xiaomi/Oppo/Vivo — không phải máy ảo), để yên **qua đêm không chạm vào**, xem sáng hôm sau thông báo có đến đúng giờ không. Lặp lại trên ít nhất 2 hãng khác nhau.
> ⚠️ Đây là bài test dễ bị bỏ qua nhất và cũng là thứ dễ giết sản phẩm nhất.

**Cách test T15 (quan trọng nhất về y tế):**
> Nhập 2 đơn khác nhau, mỗi đơn có 1 biệt dược khác tên nhưng **cùng hoạt chất** → hệ thống phải cảnh báo. Nếu không cảnh báo được thì tính năng "an toàn thuốc" chưa thành hình.

**Cách test T33/T34 (rò rỉ):**
> Tạo 2 tài khoản thuộc 2 gia đình khác nhau → dùng tài khoản A cố đọc dữ liệu gia đình B (qua console/API trực tiếp, không qua UI). Phải bị từ chối.
