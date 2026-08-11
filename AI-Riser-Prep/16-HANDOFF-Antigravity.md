# 16 — HANDOFF cho Antigravity 🤝 (v3 — BẢN CUỐI, 11/08/2026)

> **ĐỌC FILE NÀY ĐẦU TIÊN.** Giai đoạn ý tưởng · spec · prototype đã hoàn tất tại Claude. Antigravity nhận vai **THỰC THI**.
> ⏰ Hạn nộp: **23:59 ngày 30/08/2026 (GMT+7)** — còn **~19 ngày**.

---

## 1. Cuộc thi (30 giây)
**AI Riser Vietnam 2026** — build app bằng Google AI Studio.
Điểm: Ý tưởng tối đa **100** (sáng tạo/khả thi/tác động) + **Google Tech +10** + **Deploy +10** + **nộp sớm top 200 +3**.
Nộp: link AI Studio (Public) · video YouTube ≤2 phút · bài LinkedIn công khai · (tùy chọn) link Cloud Run/Play.
📄 [02-Chấm điểm](02-Cham-diem-va-giai-thuong.md) · [09-Checklist nộp bài](09-Nop-bai-Checklist.md) · [13-Giám khảo](13-Ban-giam-khao.md)

## 2. Sản phẩm
**Nền tảng sức khỏe gia đình.** Tên **chưa chốt** — phải có chữ **"NHÀ"** ([17](17-Product-Spec.md) mục 1). Tài liệu tạm gọi "Nhà Mình".

**Một câu:** Con cái chụp đơn thuốc của ba mẹ → AI đọc và giải thích bằng lời bình dân → tự tạo lịch nhắc → ba mẹ nhận nhắc trên app cực đơn giản, bấm một nút xác nhận → con cái yên tâm ở đầu bên kia.

**Định vị:** *"Các app khác nhắc BẠN uống thuốc. Chúng tôi giúp BẠN chăm ba mẹ uống thuốc."*
Không đối thủ nào (Medisafe, MyTherapy, MediHome, Long Châu) làm mô hình 2 vai trò này ([22](22-Business-Model.md) mục 4b).

**Kiến trúc 2 mặt:**
| | Web — con cái (P1) | App Android — ba mẹ (P2) |
|---|---|---|
| Vai trò | Mọi việc phức tạp | Gần như chỉ NHẬN |
| Đăng nhập | Google (1 lần consent) | **Ẩn danh + mã mời** — không cần Gmail |
| Workspace | ✅ Calendar/Tasks | ❌ không cần — dùng báo thức cục bộ |
| Đồng bộ | ←──── Firestore ────→ | |

## 3. Ràng buộc BẤT BIẾN

**3 luật thiết kế** — mọi tính năng phải pass:
1. **Zero/low-input** phía ba mẹ; gánh nặng nhập liệu dồn về con cái.
2. **Input đồng nhất** (ảnh tài liệu y tế) → task AI bounded.
3. **Token economics** — AI nặng chỉ chạy lúc nhập; vận hành hằng ngày ~0 token.

**Kỹ thuật:**
- 100% Google ecosystem, **không API bên thứ ba**.
- Dữ liệu lõi ở Firestore; scope **chỉ Calendar/Tasks** (bên con cái); **TRÁNH Gmail**.
- **Chức năng lõi không phụ thuộc AI** — AI sập thì app vẫn nhắc thuốc bình thường.
- Nhắc thuốc = **báo thức cục bộ**, chạy được khi mất mạng.

**An toàn y tế — 3 ranh giới tuyệt đối** (ngoài 3 cái này thì AI **trả lời thẳng**):
1. Không đề xuất/thay đổi **liều**.
2. Không **chẩn đoán bệnh của người** (được nói công dụng của thuốc).
3. Dấu hiệu **cấp cứu** → cắt hội thoại, gọi 115 + báo người nhà.
- ⚠️ Không để AI định danh **viên thuốc trần** ([28](28-Input-Types.md)).

**Sản phẩm:**
- **Song ngữ VI + EN** đầy đủ, chuyển ở cấp người dùng.
- **Giai đoạn thi: MIỄN PHÍ, không hiển thị giá.**
- Style **MỞ** — chỉ tránh: teal y tế, tím indigo, cam bão hòa kiểu thể thao ([18](18-Style-Prototype.md)).

## 4. Bản đồ tài liệu

| Cần gì | File |
|---|---|
| **Mọi quyết định + lý do (99 mục)** | [19-Decision-Log](19-Decision-Log.md) ← **GHI TIẾP VÀO ĐÂY** |
| Spec: personas, flows, MVP, data model, auth, cân nặng | [17-Product-Spec](17-Product-Spec.md) |
| Style + **10 rủi ro UX người già** + quy tắc UI | [18-Style](18-Style-Prototype.md) |
| Notification (N1–N6, C1–C6, escalation) | [20-Notification](20-Notification-Design.md) |
| Vòng đời đợt thuốc · Jarvis-lite · onboarding | [21-UI-Exploration](21-UI-Exploration.md) |
| **Mô hình kinh tế + direction cho demo** | [22-Business-Model](22-Business-Model.md) |
| **Bảo mật** (Firestore rules — rủi ro #1) | [23-Security](23-Security-Privacy.md) |
| Chịu tải, chi phí, rate limit | [24-Scale-Cost](24-Scale-Cost-Control.md) |
| **Prompt AI + rào an toàn + nạp hồ sơ user** | [25-AI-Prompts](25-AI-Prompts.md) |
| User thật, số liệu, **thiết bị test Android** | [26-User-Testing](26-User-Testing-Metrics.md) |
| Rủi ro & phương án B | [27-Risk-Register](27-Risk-Register.md) |
| 15 loại input, ranh giới đỏ | [28-Input-Types](28-Input-Types.md) |
| **AUDIT 43 điểm lỗi/rò rỉ/trùng (T01–T43)** | [29-Process-Audit](29-Process-Audit.md) |
| Kiến thức dược (3 tầng) | [30-Knowledge-Base](30-Knowledge-Base.md) |
| **Trợ lý: 4 mức trả lời** | [31-Assistant](31-Assistant-Conversations.md) |
| Chế độ nhà thuốc, minh bạch túi thuốc | [32-Pharmacy-Mode](32-Pharmacy-Mode.md) |
| Prototype | [demo-v3.html](prototype/demo-v3.html) (mới nhất) · [demo-v2.html](prototype/demo-v2.html) |

## 5. 🎯 Thứ tự xây (direction từ mô hình kinh tế)
Khách hàng mua **sự an tâm**, không mua danh sách tính năng. **Thiếu thời gian thì cắt từ dưới lên:**
```
① Web: chụp đơn → AI đọc → người xác nhận → lịch tự sinh       ← BẮT BUỘC
② App: nhận nhắc → "Đã uống" → đồng bộ ngược về web            ← BẮT BUỘC (khoảnh khắc chốt hạ)
③ Cảnh báo kiêng ăn (M12) + trùng hoạt chất (T15)              ← BẮT BUỘC
④ Trợ lý giọng nói (4 mức trả lời)
⑤ Chế độ nhà thuốc · tủ thuốc · Maps · chỉ số sức khỏe
```

## 6. Lịch 19 ngày

| Giai đoạn | Ngày | Việc |
|---|---|---|
| **P0 — Chốt** | 11–12/08 | Tên (+tên trợ lý) · style · data model · **mượn 1 máy Android cho cả tháng** · kiểm tra khả năng AI Studio (báo thức nền, offline) |
| **P1 — Nền** | 12–14/08 | Firestore schema + **security rules (làm TRƯỚC khi có user thật)** · seed `med_catalog` 50–100 thuốc VN |
| **P2 — Web MVP** | 13–18/08 | Luồng ①: trích xuất + xác nhận + lịch + vòng đời đợt thuốc |
| **P3 — Deploy + nộp nháp** ‼️ | 16–18/08 | Cloud Run (+10đ) · **nộp form bản nháp** (top 200 = +3đ, cập nhật sau được) |
| **P4 — Android** | 17–23/08 | Luồng ②: app ba mẹ · notification · **test T22 qua đêm trên máy thật** |
| **P5 — User thật** | 14–26/08 | **Gia đình mình trước** → bạn bè → cộng đồng ([26](26-User-Testing-Metrics.md)) |
| **P6 — Hoàn thiện** | 24–28/08 | ③④⑤ · golden set đo độ chính xác · bản EN · playbook ngày chấm bài |
| **P7 — Nộp** | 28–30/08 | Video ≤2 phút · LinkedIn · số liệu + câu chuyện vào form · rà [09](09-Nop-bai-Checklist.md) |
| P8 | →10/09 | Đẩy tương tác bài MXH |

## 7. Quy ước làm việc
- **Folder này là bộ nhớ dự án.** Index: [00-README](00-README.md).
- **Ghi tiếp vào [19-Decision-Log](19-Decision-Log.md)** mỗi khi có quyết định, kèm lý do — **yêu cầu trực tiếp của Thanh**.
- Đừng brainstorm lại thứ đã loại — lý do ghi rõ trong log.
- Mọi tích hợp phải là **code thật** (giám khảo mở AI Studio link xem code).
- Ưu tiên: **chạy được > đẹp > nhiều tính năng**.

## 8. ⏳ Việc Thanh còn phải quyết
1. **Tên app + tên trợ lý** (bắt buộc có chữ "Nhà")
2. **Bảng màu / style** (3 hướng trong [18](18-Style-Prototype.md))
3. Màn hình chính app ba mẹ — Claude đề xuất **phương án A + 4 chấm tiến độ**
4. Chốt MVP cuối (hiện M1–M22, chưa khóa)
5. Mượn máy Android · tìm dược sĩ rà bộ câu trả lời Mức 2

## 9. ☠️ 5 thứ dễ giết dự án nhất
| # | Rủi ro | Xử lý |
|---|---|---|
| 1 | **Firestore rules lỏng** (`if request.auth != null`) → lộ dữ liệu mọi gia đình | Rules phạm vi gia đình + test Rules Playground TRƯỚC khi có user ([23](23-Security-Privacy.md)) |
| 2 | **Android OEM giết tiến trình nền** → thông báo không đến | Exact alarm + xin miễn trừ tối ưu pin lúc setup + **test qua đêm máy thật** (T22) |
| 3 | **Trùng hoạt chất khác biệt dược** → quá liều | Chuẩn hóa về hoạt chất, cảnh báo (T15) — vừa là lỗi phải chặn vừa là tính năng cứu mạng |
| 4 | Ôm quá nhiều tính năng → không kịp 30/08 | Bám thứ tự ①→⑤, cắt từ dưới lên |
| 5 | Không có user thật → mất cơ hội Gold | Cài cho gia đình mình **ngay khi có bản chạy được** |

**Bẫy nhỏ:** account đã publish AI Studio (mất Starter Tier — ✅ đã xử lý) · link AI Studio/video/LinkedIn để private · video >2 phút · ngôn ngữ "chẩn đoán/kê đơn" trong app hoặc mô tả Play · hiển thị giá trong bản dự thi · 1 email = 1 submission.
