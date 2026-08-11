# 18 — Style & UX cho người lớn tuổi (v3 — 11/08)

> Style **chưa chốt**, quyết khi build thật. Nhưng phần **UX an toàn cho người lớn tuổi** ở mục 3–5 là **yêu cầu sản phẩm**, không phải thẩm mỹ — phải giữ dù chọn màu nào.

## 1. Đã loại (đừng quay lại)

| Hướng | Lý do loại | Ai quyết |
|---|---|---|
| Teal / xanh y tế | Giống mọi app health có sẵn → mất khác biệt | Thanh |
| **Cam đất đậm** | Cảm giác Strava / thể thao, không phải chăm sóc | Thanh |
| **Tím indigo** (thử ở demo v2) | **Không hợp** | Thanh (11/08) |

## 2. Hướng còn lại để thử

| Hướng | Mô tả | Vì sao đáng thử |
|---|---|---|
| **A — Xanh lá rừng ấm** | Nền kem, hành động xanh lá đậm (`#2F5D4E`-ish), điểm nhấn vàng mật ong rất nhẹ | Xanh lá = sức khỏe, sự sống — nhưng **xanh lá đậm khác hẳn teal y tế**. Tương phản cao, dễ đọc |
| **B — Xanh navy ấm** | Nền kem, hành động navy sâu (`#1F3A5F`), điểm nhấn hồng đất nhạt | Đáng tin, điềm đạm, **tương phản tốt nhất cho mắt kém**. Navy ≠ teal |
| **C — Đơn sắc ấm** ⭐ | Gần như không màu: nền kem, chữ nâu-đen đậm, **1 màu nhấn duy nhất** dùng rất tiết chế | Đúng nhất với "minimal + futuristic + thân thiện"; ít màu = ít rối = hợp người già. Rủi ro thấp nhất |

> Gợi ý: thử **C trước** — dễ đẹp, khó sai, và để dành 1 màu nhấn thì lúc nào cũng đổi được mà không phải làm lại giao diện.

## 3. ⚖️ Phương án A hay B cho màn hình chính? (Thanh hỏi: hộp thuốc ảo có dễ hiểu không?)

**Đánh giá thật — B rủi ro hơn A:**

| | Phương án A (danh sách) | Phương án B (hộp thuốc ảo) |
|---|---|---|
| Mental model | Đơn giản, phổ quát | Chỉ quen **nếu** người đó đang dùng hộp chia thuốc thật — ở VN **không phổ biến** như phương Tây (nhiều bác giữ thuốc trong túi/vỉ gốc) |
| Ảnh viên thuốc | Hiện **to**, rõ — quan trọng sống còn với bác không đọc được chữ (C4) | Ô nhỏ → ảnh nhỏ → **mất lợi thế nhận diện bằng mắt** |
| Khi 1 cữ có nhiều thuốc | Cuộn danh sách bình thường | Ô chật, phải thu nhỏ hoặc ẩn bớt → dễ sót thuốc |
| Lịch không theo 4 cữ (2 lần/ngày, 5 lần/ngày) | Không vấn đề | Lưới 4 ngăn **gãy** |
| Nguy cơ hiểu nhầm | Thấp | Hình vẽ trang trí dễ bị tưởng là hình minh họa, không biết bấm được |

**→ Đề xuất: lấy A làm màn hình chính.** Nhưng giữ tinh thần tốt của B bằng cách **lai**:
```
┌─────────────────────────────┐
│  ● ● ○ ○   Sáng Trưa Chiều Tối   ← 4 chấm tiến độ (chỉ để NHÌN, không bấm)
├─────────────────────────────┤
│  [ẢNH VIÊN THUỐC TO]        │
│  Viên huyết áp trắng        │   ← 1 việc cần làm NGAY, to rõ
│  1 viên · sau ăn sáng       │
│  ┌───────────────────────┐  │
│  │   ✓  Đã uống rồi      │  │   ← nút chính, chiếm hết chiều ngang
│  └───────────────────────┘  │
└─────────────────────────────┘
```
Được cả hai: cảm giác "hộp thuốc" (4 chấm cho biết hôm nay đi tới đâu) **+** ảnh thuốc to và một hành động duy nhất.

**Nguyên tắc quan trọng nhất:** màn hình chính của ba mẹ chỉ trả lời **một câu** — *"bây giờ tôi cần làm gì?"* — không phải hiển thị cả ngày.

## 4. 🚨 Rủi ro UX cho người lớn tuổi (Thanh hỏi: có rủi ro gì cần bàn?)

| # | Rủi ro | Vì sao nguy hiểm | Cách xử lý an toàn |
|---|---|---|---|
| U1 | **Bấm "Đã uống" mà chưa uống** (bấm cho xong, hoặc bấm nhầm) | Dữ liệu sai → con tưởng ổn | Nút xác nhận đặt **xa các nút khác**; không đặt ở vị trí ngón tay hay chạm nhầm; chấp nhận dữ liệu "mềm" ([20](20-Notification-Design.md)) |
| U2 | **Run tay → bấm nhầm nút bên cạnh** | Ghi sai | Vùng chạm **≥56px**, khoảng cách giữa các nút **≥16px**, không có nút nguy hiểm cạnh nút thường dùng |
| U3 | **Thị lực kém, tương phản thấp** | Không đọc được | Tương phản tối thiểu **7:1** cho chữ chính; chữ ≥18px, tên thuốc ≥22px; không dùng chữ xám nhạt trên nền nhạt |
| U4 | **Không hiểu icon trừu tượng** | Bấm bừa hoặc không dám bấm | Mọi icon **kèm chữ**; không bao giờ chỉ có icon |
| U5 | **Sợ làm hỏng, không dám bấm** | Không dùng app | Không có thao tác nào **không hoàn tác được** ở phía ba mẹ; luôn có "quay lại"; không bao giờ hiện cảnh báo đỏ dọa dẫm |
| U6 | **Nghe không rõ thông báo** | Bỏ lỡ liều | Âm báo **tần số thấp** (người già nghe kém ở tần số cao); rung + đọc to; âm lượng ưu tiên |
| U7 | Lạc trong app, không biết quay về | Bỏ cuộc | Tối đa **2 tầng màn hình**; luôn có nút về Trang chính to |
| U8 | Chữ tiếng Anh lẫn vào | Không hiểu | Bản của ba mẹ **thuần Việt**, kể cả thông báo lỗi |
| U9 | Nhiều thông báo dồn dập | Phiền → tắt thông báo → hỏng cả sản phẩm | Gộp thông báo (T17), ngân sách thông báo/ngày, giờ yên tĩnh |
| U10 | Cập nhật app đổi giao diện | Học lại từ đầu | Hạn chế đổi bố cục màn hình chính; đổi thì con cái được báo trước |

## 5. Quy tắc UI bắt buộc (giữ dù chọn style nào)
1. Màn hình chính ba mẹ: **1 việc cần làm + 1 nút chính**.
2. **Không có màn hình cài đặt** phía ba mẹ (trừ cỡ chữ) — mọi cấu hình do con cái làm trên web.
3. Icon **luôn kèm chữ**. Chữ tiếng Việt đời thường, không thuật ngữ.
4. Tên thuốc = **cách gọi ở nhà** + ảnh thật; tên hóa học là dòng phụ nhỏ.
5. Mọi thông tin quan trọng đều có **kênh giọng nói** song song.
6. Không màu đỏ báo động ở phía ba mẹ — cảnh báo nghiêm trọng đẩy về **web của con cái**.
7. Web (con cái) được phép **dày đặc thông tin**; app (ba mẹ) phải **thưa và to**. Cùng bộ màu, hai nhịp độ.

## 6. Prototype
- [prototype/demo-v2.html](prototype/demo-v2.html) — song ngữ, có cả A và B. ⚠️ Màu tím trong đó **đã bị loại**, chỉ còn dùng để xem bố cục.
- 🔲 Prototype v3 (khi Thanh muốn): thử hướng C đơn sắc ấm + bố cục lai ở mục 3.
