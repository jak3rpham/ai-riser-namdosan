# 21 — UI Exploration + Feature vòng 3 (v1 — CHỜ THANH DUYỆT)

> Khai thác các góc UI "nhiều cái để chơi" (lời Thanh) + chốt 2 bài toán mới: vòng đời đợt thuốc & Jarvis. Style tổng thể vẫn MỞ ([18](18-Style-Prototype.md)) — dưới đây là **pattern/cấu trúc**, không phải màu mè.

## 1. 💊 Vòng đời đợt thuốc (M18 — NÂNG LÊN LÕI MVP)
Bài toán Thanh nêu: *"không thể nào cứ uống suốt được — input thuốc vô thì app phải biết khi nào hết để ngừng nhắc, kiểm soát routine từng loại thuốc."*

**Thiết kế:** mỗi thuốc khi confirm đơn được phân loại:
| Loại | Ví dụ | Hành xử |
|---|---|---|
| **Đợt (course)** | kháng sinh 7 ngày | Có start_date + duration từ toa → **ngày cuối tự ngừng nhắc**, bắn N6/C6 "xong đợt 🎉"; toa dặn tái khám → gợi ý đặt lịch |
| **Dài hạn (chronic)** | huyết áp, tiểu đường | Nhắc liên tục; ước số viên còn lại (số lượng kê − số liều đã uống) → **còn ≤5 ngày báo con mua thêm** (C5) kèm nhà thuốc gần |
| **Khi cần (PRN)** | hạ sốt, giảm đau | KHÔNG nhắc lịch; chỉ nằm trong tủ thuốc + tra cứu "uống được không, cách liều trước bao lâu" |
- Calendar events tạo với **end date đúng đợt** — không rác lịch vĩnh viễn.
- Timeline thuốc của member hiển thị dạng "thanh đợt" (đang chạy / sắp xong / đã xong) → con nhìn 1 phát biết routine cả nhà.
- *Reasoning:* đây chính là "kiểm soát routine từng loại thuốc" — và là điểm ăn tiền feasibility: app hiểu thuốc có vòng đời, không phải cái máy nhắc mù.

## 2. 🎙️ "Jarvis-lite" — trợ lý giọng nói (nâng cấp M7)
Thanh: *"ban đầu t có ý tưởng kiểu Jarvis trong Ironman nhưng sợ khó, khó tích hợp giọng cỡ đó."*

**Phân tích khả thi (thật, không động viên suông):**
- ✅ **Làm được ở mức "Jarvis moment":** Gemini **Live API** hỗ trợ hội thoại giọng nói real-time 2 chiều, là integration native của AI Studio ([15](15-Google-Ecosystem.md)). Bấm 1 nút → nói chuyện tự nhiên về hồ sơ của chính mình → nghe trả lời bằng giọng tự nhiên. Đủ "wow" cho demo và đủ thật cho ba mẹ.
- ⚠️ **Cần test sớm:** chất lượng tiếng Việt của Live API (giọng đọc + hiểu giọng người già/vùng miền). **Fallback đã thiết kế sẵn:** STT → Gemini text → TTS (3 bước rời, chậm hơn ~1-2s nhưng chắc chắn chạy).
- ❌ **Không làm:** Jarvis "ambient" luôn lắng nghe/wake-word — tốn pin, rủi ro privacy, khó trên app thường, ngoài scope 20 ngày. Kích hoạt = **bấm nút** (hoặc mở từ notification N3).
- **Persona hóa:** trợ lý có tên riêng, 1 âm tiết dễ gọi (*"... ơi, chiều nay tôi uống thuốc gì?"*). Giọng ấm, xưng "con/cháu" với người già — chi tiết văn hóa mà không app ngoại nào có.
  - ⚠️ **Tên trợ lý PHỤ THUỘC tên app** (coupling) — cả hai đều **chưa chốt**, sẽ quyết cùng lúc ở vòng đặt tên riêng. "Khang" trong tài liệu chỉ là ví dụ minh họa.
- *Reasoning:* Jarvis thật = tương lai (V2+ khi có wake word tốt); còn "bấm nút → nói chuyện được với người hiểu hồ sơ mình" đã là Jarvis trong mắt một bác 68 tuổi rồi.

## 3. 📦 UI patterns đề xuất

### P2 (app ba mẹ)
| Pattern | Mô tả | Reasoning |
|---|---|---|
| **"Hộp thuốc ảo" 4 ngăn** 🧪 *(1 option để TEST, chưa chốt)* | Màn hình thuốc = hộp chia thuốc Sáng/Trưa/Chiều/Tối như hộp nhựa thật người già đang dùng; ngăn nào xong thì "đóng nắp" ✓ | Mental model CÓ SẴN — không phải học UI mới. **Rủi ro (Thanh nêu):** skeuomorphism dễ thành xấu/rối nếu làm không khéo — phải đẹp & dễ nhìn mới giữ. Test cạnh phương án list phẳng minimal rồi chọn |
| Ảnh thuốc thật cỡ lớn | Card thuốc: ảnh viên/vỉ THẬT nhà mình chiếm 50% card, tên gọi dễ hiểu bên dưới | C4 không đọc được chữ vẫn nhận đúng thuốc |
| 1 câu trạng thái ấm | Đầu màn hình: "Hôm nay bác uống đủ thuốc rồi, khỏe nha! ☀️" | Cảm xúc dương, không phải bảng số liệu |
| Nút gọi con | 1 nút to gọi thẳng người thân (deep-link phone) | Không thay Zalo — chỉ là lối tắt an tâm |
| Font/contrast toggle | 2 mức: Lớn / Rất lớn + chế độ tương phản cao | Accessibility C1–C4 |

### P1 (web con cái)
| Pattern | Mô tả | Reasoning |
|---|---|---|
| **"Dòng ngày" cả nhà** | Timeline dọc 1 ngày: 7:00 Ba ✓ · 7:30 Mẹ ⏳ · 12:00... | Trả lời câu duy nhất con cần: "hôm nay nhà mình ổn không?" |
| Thanh đợt thuốc (M18) | Gantt mini mỗi member: đợt đang chạy/sắp hết | Nhìn 1 phát ra routine |
| Bảng tin gia đình | Feed "Báo ổn" ❤️ + mốc sự kiện (xong đợt thuốc, chỉ số mới) | Ấm — như group chat mà không cần chat |
| Wizard nhập đơn 3 bước | Chụp → Confirm (highlight field kém tin) → Lịch tự sinh xem trước | Flow F2 thành UI cụ thể |

### Onboarding — "Ba mẹ KHÔNG setup gì cả" ⭐ (M19 — thiết kế lại v2)
**Mâu thuẫn Thanh chỉ ra (10/08):** người già không hiểu "đăng nhập" là gì — nhưng bắt họ quét QR cũng chẳng dễ hơn. → **Kết luận: con cái làm hộ 100%, ba mẹ không thao tác setup gì.**

| Case | Tình huống | Flow |
|---|---|---|
| **A — Mặc định** ⭐ | Con ở gần / về thăm nhà | Con **cầm điện thoại ba mẹ**: cài app, đăng nhập, pair, chỉnh cỡ chữ + chế độ C1–C4, chụp ảnh thuốc → trả máy. Ba mẹ mở lên đã thấy màn hình thuốc của mình. **Zero thao tác setup.** |
| **B — Con ở xa** | Không cầm được máy ba mẹ | Con gửi **link mời qua Zalo/SMS** → ba mẹ chỉ cần **bấm vào link** (thao tác đã quen thuộc hằng ngày) → app mở & tự pair bằng token. Kèm hướng dẫn qua cuộc gọi video nếu cần. |
| C — Option | Có mặt trực tiếp, không muốn cầm máy | Quét QR trên màn hình web của con |

- *Reasoning:* bấm link trong Zalo là thao tác người già VN **đã làm mỗi ngày** (nhận link con gửi) — quen hơn nhiều so với mở camera quét mã. QR hạ từ "giải pháp chính" xuống "option".
- Hệ quả thiết kế: **mọi thay đổi cấu hình về sau (thêm thuốc, đổi giờ, đổi chế độ) đều do con làm trên web** — app phía ba mẹ không có màn hình cài đặt phức tạp, chỉ có toggle cỡ chữ.
- 🔲 Câu hỏi còn mở: ba mẹ dùng Google account của chính họ (nhiều bác đã có sẵn do máy Android) hay "profile không account" do con quản lý? → quyết ở P0.

## 4. Feature vòng 3 — bổ sung vào spec
| ID | Tính năng | Ưu tiên đề xuất |
|---|---|---|
| **M18** | Vòng đời đợt thuốc (course/chronic/PRN + auto-stop + ước viên còn lại) | **MVP — LÕI** (nhập chung với M5) |
| **M19** | Onboarding zero-setup: con làm hộ / link Zalo / QR (option) | **MVP** (onboarding là cửa tử) |
| M20 | 🧪 "Hộp thuốc ảo" 4 ngăn — **option test UI**, so với list phẳng minimal | Chưa quyết — chọn khi test thấy đẹp & dễ dùng |
| M21 | Jarvis-lite (nâng M7, Live API + fallback); tên persona chờ vòng đặt tên | MVP phần cơ bản (bấm nút hội thoại); persona trau chuốt dần |
| V2 | Widget màn hình chính · notification theo thời tiết · "Bản tóm tắt cho bác sĩ" xuất **Google Docs** (thêm 1 Workspace API — điểm tech depth) · wake-word "Khang ơi" | Roadmap pitch |

## ✅ Trạng thái sau vòng duyệt 10/08
- M18 vòng đời đợt thuốc: **duyệt** (hướng đúng).
- M21 Jarvis-lite: **duyệt hướng** (bấm nút + Live API + fallback); *tên persona chờ vòng đặt tên*.
- M19 onboarding: **duyệt, đã thiết kế lại** — con làm hộ là chính, link Zalo cho ca ở xa, QR chỉ là option.
- M20 hộp thuốc ảo: 🧪 **option test**, chưa chốt.
- Toàn bộ: **MVP chưa khóa** — chưa thêm feature nào vào scope chính thức.
