# 35 — Nhật ký sửa an toàn (12/08/2026)

> Ghi lại những gì đã sửa từ audit [33](33-Medical-Safety-Audit.md), và quan trọng hơn: **những gì vẫn chưa an toàn**.
> Đọc kèm [33](33-Medical-Safety-Audit.md) để biết vấn đề gốc, [34](34-Testing-On-iPhone.md) để test.

## 0. Tóm tắt

| | Số mục |
|---|---|
| 🔴 Chặn ship — đã sửa | 7/7 |
| 🟠 Nghiêm trọng — đã sửa | 8/8 |
| 🟡 Vừa — đã sửa | 3/3 |
| ➕ Lỗi mới phát hiện khi sửa | 3 (đã sửa) |
| 🔲 **Còn lại, không code được** | **3** — xem mục 4 |

Xác minh: `npm run build` sạch · `npm run test:safety` **33/33 đạt** · thử tay trên viewport 375px.

---

## 1. Kiến trúc mới cho phần triệu chứng

Đây là thay đổi lớn nhất, trả lời trực tiếp mối lo *"đau bụng thì vùng nào"*.

**Nguyên tắc: LLM không được ra quyết định an toàn.**

```
Người dùng nhắc tới triệu chứng
        ↓
[1] classifyUtterance()          — nhận diện, KHÔNG kết luận
        ↓
[2] SymptomIntakePanel           — 4 câu hỏi CỐ ĐỊNH, không do AI sinh
     vị trí · thời điểm · mức độ · triệu chứng kèm
        ↓
[3] RED_FLAG_RULES               — bảng luật tĩnh, phiên bản hoá, test được
        ↓
[4] Ba nhánh cố định
     🔴 EMERGENCY_115    câu cố định + nút gọi 115
     🟠 SEE_DOCTOR_24H   câu cố định + mốc thời gian rõ
     🟢 LOG_AND_NOTIFY   ← chỉ nhánh này mới gọi AI, và chỉ để DIỄN ĐẠT
```

File mới:
- `src/services/symptomTriage.js` — bảng luật + bộ hỏi
- `src/components/SymptomIntakePanel.jsx` — giao diện hỏi
- `src/services/medicalKnowledge.js` — kho kiến thức dược (tầng 1 của doc 30)
- `src/services/safetyChecks.js` — bốn nhóm kiểm tra chạy nền (tầng 2)
- `src/components/MedicalDisclaimer.jsx`
- `tests/safety.test.mjs` — 33 ca

### Ca cụ thể mà bản cũ bỏ sót, giờ bắt được

| Tình huống | Bản cũ | Bây giờ |
|---|---|---|
| Ba Mười 68t (uống Amlodipine + Atorvastatin): *"đau bụng trên, buồn nôn, vã mồ hôi"* | AI trả lời tự do theo hướng tác dụng phụ thuốc | **115** — luật `RF-ACS-ATYPICAL` (nhồi máu cơ tim thể không điển hình) |
| *"đau bụng dưới phải, sốt nhẹ"* | không chặn | **Khám 24h** — `RF-APPENDIX` |
| *"mỏi chân, nước tiểu sẫm màu"* khi uống statin | không chặn | **Khám 24h** — `RF-STATIN-RHABDO` |
| *"mệt, khó thở"* khi uống metformin | không chặn | **115** — `RF-METFORMIN-LACTIC` |
| *"tức ngực"*, *"hụt hơi"*, *"méo miệng"* | không khớp keyword nào | bắt được |
| *"hồi năm ngoái bác đau ngực chứ giờ hết rồi"* | **bắn báo động 115** | hỏi lại một câu, không báo động |

---

## 2. Bảng đối chiếu từng lỗi

### 🔴 Nhóm chặn ship

| # | Trước | Sau | File |
|---|---|---|---|
| C1 | 9 keyword, `includes()`, không có tầng triệu chứng | Bộ hỏi cấu trúc + 18 luật red-flag + 33 test | `symptomTriage.js` |
| C2 | Nói *"Con đã gửi tin nhắn báo động cho gia đình rồi ạ"* — **không có code nào gửi** | Bỏ câu đó. Có nút "Báo cho người nhà" người dùng tự bấm, trạng thái đổi khi bấm | `geminiService.js`, `VoiceAssistantModal.jsx` |
| C3 | Hồ sơ thuốc hardcode trong prompt → chọn Mẹ Lan vẫn tư vấn thuốc Ba Mười | `buildMemberContext()` nạp hồ sơ thật: thuốc, liều, giờ, ngày còn lại, dị ứng, cờ thuốc đặc biệt | `geminiService.js:60` |
| C4 | API lỗi → trả về đơn Amlodipine+Atorvastatin bịa kèm tên bác sĩ giả, UI vẫn báo "đọc thành công" | Trả `{ok:false, error_code}` → màn báo lỗi + nhập tay. **Không còn đường nào sinh ra dữ liệu thuốc giả** | `geminiService.js:120` |
| C5 | `runGoldenSetBenchmark` = `setTimeout` + hằng số viết tay, `status:"PASSED"` cho mọi ca | Bộ chạy thật: gọi Gemini, so từng trường với đáp án, thuốc bỏ sót tính sai toàn bộ. Chưa có dataset → hiện "chưa đo", **không sinh số** | `benchmarkService.js` |
| C6 | *"An toàn 100%"* + *"National Pharmacopeia Base"* | "Chưa phát hiện xung đột **trong phạm vi đã kiểm**" + khối ghi rõ đã đối chiếu bao nhiêu thuốc, thuốc nào **chưa** kiểm được | `SignatureAlertCard.jsx` |
| C7 | Badge "✓ An toàn" hardcode trong JSX — 180/110 vẫn "An toàn" | Ngưỡng tĩnh cho huyết áp / đường huyết / nhiệt độ, có nhánh cảnh báo nặng | `medicalKnowledge.js`, `HealthTrackerCard.jsx` |

### 🟠 Nhóm nghiêm trọng

| # | Trước | Sau |
|---|---|---|
| H1 | Rào an toàn còn 4/35 dòng | Dán lại đủ 8 ràng buộc, **kể cả nhóm `special_missed_dose`** (chống đông, insulin, tuyến giáp, động kinh...) — bản cũ dạy AI áp quy tắc quên liều chung cho mọi thuốc |
| H2 | Dị ứng Penicillin chỉ để hiển thị, không kiểm | `checkAllergies()` — 6 nhóm dị ứng, có cả **dị ứng chéo** penicillin ↔ cephalosporin |
| H3 | Bảng biệt dược có **1** hoạt chất | ~150 biệt dược VN → hoạt chất, **có thuốc phối hợp** (Alaxan = ibuprofen + paracetamol, Augmentin = amoxicillin + clavulanic) |
| H4 | Không có tương tác thuốc–thuốc | 10 cặp hay gặp ở người cao tuổi (chống đông + NSAID, statin + macrolid, ACE-I + ARB...) |
| H5 | Màn "Human Confirm" chỉ render text, không sửa được | Sửa trực tiếp từng trường; ô AI đọc <85% chắc chắn **tô vàng**; thêm/xoá thuốc; kiểm tra an toàn chạy ngay tại màn này trước khi lưu |
| H6 | Default bịa: `"Uống 1 viên"`, `14` ngày, mọi thuốc không parse được giờ → cữ **Tối** | Trường thiếu để trống, **chặn lưu** kèm thông báo cụ thể |
| H7 | "Gemini Vision đọc máy đo" = `Math.random()`, toast hiện số khác số vừa sinh | Gỡ tính năng giả, thay bằng nhập tay có kiểm tra khoảng hợp lệ |
| H8 | Card kiêng ăn hardcode, không liên quan member; 1 mục sai dược lý (statin ↔ chất béo bão hoà) | Suy từ thuốc thật của member; mục sai đã bỏ; nói rõ thuốc nào **chưa** nhận dạng được |

### 🟡 Nhóm vừa

| # | Sửa |
|---|---|
| M1 | Thêm `MedicalDisclaimer` — chân dashboard, trong modal Cháu Bi, dưới mỗi khối cảnh báo. Trước đó toàn app **không có một dòng nào** |
| M2 | Bỏ phân loại Rx/OTC bằng `name.includes('5mg')`. Thiếu `type` → nhóm "chưa phân loại" thay vì đoán |
| M3 | `temperature: 0.2` cho trích xuất (trước để mặc định 1.0), `responseMimeType: json`, `maxOutputTokens` |

### ➕ Lỗi mới phát hiện trong lúc sửa

| Lỗi | File |
|---|---|
| `ParentHomeView` gom thuốc **cả nhà**, không lọc theo member → điện thoại Mẹ Lan hiện thuốc Ba Mười. Chưa có đơn thì fallback về "Amlodipine 5mg" bịa | `ParentHomeView.jsx:18` |
| `FamilyDashboard` có `|| prescriptions[0]` → member chưa có đơn sẽ hiện đơn người khác | `FamilyDashboard.jsx:21` |
| **`.btn-parent-action` chưa bao giờ được định nghĩa trong CSS** — nút "ĐÃ UỐNG RỒI", nút quan trọng nhất của giao diện người lớn tuổi, đang render mặc định trình duyệt | `index.css` |

---

## 3. Cách kiểm chứng

```bash
npm run test:safety
```

33 ca, chia 7 nhóm: ca bản cũ bỏ sót · không báo động thừa · nhận diện câu nói · ánh xạ biệt dược · dị ứng · trùng hoạt chất & tương tác · ngưỡng chỉ số.

Đây là **bộ test cố tình gài** mà [31](31-Assistant-Conversations.md) mục 7 đặt ra. Sửa bảng luật thì chạy lại.

---

## 4. 🔲 CÒN LẠI — phải làm trước khi mời người dùng thật

Ba việc này **không code được**, và chúng quan trọng hơn mọi thứ đã sửa ở trên.

### 4.1 Dược sĩ / bác sĩ rà bảng luật ⭐ quan trọng nhất

Bảng `RED_FLAG_RULES` và kho `medicalKnowledge.js` do người **không có chuyên môn y khoa** soạn. Nó chọn hướng thận trọng, nhưng thận trọng **không thay được chuyên môn**. Cả hai file đều mang cờ:

```js
reviewed_by_clinician: false
reviewed_by_pharmacist: false
```

Cần người có chuyên môn xem: luật nào thiếu, luật nào quá nhạy (gây báo động thừa), ngưỡng chỉ số có phù hợp người cao tuổi Việt Nam không.

> [30](30-Knowledge-Base.md) mục 6 và [31](31-Assistant-Conversations.md) mục 7 đều đã ghi việc này là 🔲 từ trước. Nó vẫn là hạng mục đáng đầu tư nhất — vừa là an toàn thật, vừa là chi tiết mạnh trong bài nộp mà không đội nào tự code ra được.

### 4.2 Golden Set — thu 15–20 ảnh đơn thật

Bộ chạy đã sẵn sàng, thiếu dataset. Cần ảnh thật + đáp án tự ghi tay, nạp vào `GOLDEN_SET_CASES`.

Đến khi có: **không đưa con số độ chính xác nào vào bài nộp hay video**.

### 4.3 Quyết định phạm vi — cần Thanh chốt

Hiện app **có** trả lời câu hỏi triệu chứng, qua bộ hỏi cấu trúc. Lựa chọn còn lại:

| Phương án | Đổi lại |
|---|---|
| **A. Giữ như hiện tại** | Hữu ích hơn, nhưng buộc phải có 4.1 trước khi có người dùng thật |
| **B. Thu hẹp** — không nhận câu hỏi triệu chứng, gặp thì ghi nhận + báo con cái + khuyên gọi bác sĩ | An toàn hơn hẳn, dễ bảo vệ trước ban giám khảo. Mất một phần tính năng |

Ghi chú cho phương án B: lập luận ở [31](31-Assistant-Conversations.md) *"người dùng sẽ đi hỏi ChatGPT nên app trả lời còn an toàn hơn"* **đúng cho Mức 1–2** (câu hỏi về thuốc trong hồ sơ — app có lợi thế thông tin thật). Nó **không áp dụng cho triệu chứng**: ở đó app không có lợi thế nào, vì nó không khám được bệnh nhân. Trả lời nửa vời về triệu chứng, bằng giọng thân mật đáng tin của "cháu trong nhà", còn nguy hiểm hơn câu trả lời chung chung của ChatGPT — vì người dùng tin nó hơn.

---

## 5. Nguyên tắc rút ra, áp cho mọi tính năng sau này

1. **Quyết định an toàn không do LLM đưa ra.** Bảng tĩnh chọn nhánh, LLM chỉ diễn đạt.
2. **Thất bại thì báo thất bại, không lấp bằng dữ liệu bịa.** Fallback trả dữ liệu y tế giả nguy hiểm hơn màn báo lỗi.
3. **Không khẳng định an toàn quá phạm vi đã kiểm được.** "An toàn 100%" làm người dùng ngừng cảnh giác — tệ hơn là không nói gì.
4. **Số liệu chất lượng phải đo được.** Chưa đo thì ghi "chưa đo".
5. **Thứ nào chưa có chuyên môn duyệt thì gắn cờ, và hiển thị cờ đó cho người dùng thấy.**
