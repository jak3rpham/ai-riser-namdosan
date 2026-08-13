# 33 — Audit An toàn Y khoa (bản code ngày 12/08)

> Đối chiếu **code thực tế** trong `src/` với bộ rào an toàn đã thiết kế ở [25](25-AI-Prompts.md) mục 0, [27](27-Risk-Register.md) R10/E1, [30](30-Knowledge-Base.md) mục 4, [31](31-Assistant-Conversations.md).
>
> **Kết luận một câu:** doc an toàn viết đúng và đủ; code implement được ~20% trong đó, và phần bị bỏ lại chính là phần ngăn tai nạn. Ngoài ra có **4 chỗ app khẳng định an toàn/độ chính xác mà không có cơ sở** — nhóm này nguy hiểm hơn nhóm thiếu tính năng, vì nó làm người dùng ngừng cảnh giác.

---

## 0. Bảng tổng hợp theo mức nghiêm trọng

| # | Vấn đề | File | Mức |
|---|---|---|---|
| C1 | Không có tầng phân loại triệu chứng (câu hỏi "đau bụng vùng nào") | `geminiService.js:128–196` | 🔴 Chặn ship |
| C2 | Báo động cấp cứu nói dối "đã gửi tin cho gia đình" | `geminiService.js:145` | 🔴 Chặn ship |
| C3 | Hồ sơ thuốc trong prompt bị hardcode → tư vấn thuốc người này cho người khác | `geminiService.js:175` | 🔴 Chặn ship |
| C4 | API lỗi → app bịa ra một đơn thuốc và hiện "✓ đọc thành công" | `geminiService.js:198–226` + `PrescriptionUploadWizard.jsx:100` | 🔴 Chặn ship |
| C5 | Golden Set benchmark là số hardcode, không chạy gì | `benchmarkService.js:54–86` | 🔴 Rủi ro hồ sơ dự thi |
| C6 | "An toàn 100%" / "National Pharmacopeia Base" — khẳng định sai | `SignatureAlertCard.jsx` | 🔴 |
| C7 | Chỉ số sinh hiệu nào cũng gắn nhãn "✓ An toàn" | `HealthTrackerCard.jsx:69` | 🔴 |
| H1 | Rào an toàn trong prompt còn 4 dòng / 35 dòng của doc 25 | `geminiService.js:177–181` | 🟠 |
| H2 | Không kiểm dị ứng đối chiếu đơn mới (Penicillin chỉ để hiển thị) | `geminiService.js:76–126` | 🟠 |
| H3 | Ánh xạ biệt dược → hoạt chất chỉ có **1** hoạt chất | `geminiService.js:87–89` | 🟠 |
| H4 | Không có kiểm tra tương tác thuốc–thuốc | thiếu hoàn toàn | 🟠 |
| H5 | Màn "Human Confirm" không cho sửa; không có confidence | `PrescriptionUploadWizard.jsx:91–135` | 🟠 |
| H6 | Default lấp chỗ trống bịa liều/giờ/số ngày | `PrescriptionUploadWizard.jsx:44–57` | 🟠 |
| H7 | "AI Vision đọc máy đo" là `Math.random()` | `HealthTrackerCard.jsx:20–34` | 🟠 |
| H8 | Card kiêng ăn là mock cứng, có 1 mục sai dược lý | `FoodInteractionCard.jsx` | 🟠 |
| M1 | Không có disclaimer y tế ở bất kỳ đâu trong app | toàn `src/` | 🟡 |
| M2 | Phân loại Rx/OTC bằng `includes('5mg')` ngay ở màn đưa dược sĩ | `PharmacyModeModal.jsx:22–23` | 🟡 |
| M3 | Không set temperature / không dùng structured output | `geminiService.js` | 🟡 |

---

## 1. 🔴 C1 — Không có tầng triệu chứng. Đây đúng là chỗ Thanh lo.

### Hiện trạng code
```js
// geminiService.js:128
const EMERGENCY_KEYWORDS = [
  "đau ngực", "khó thở", "ngất", "tê nửa người", "nói khó",
  "chảy máu nhiều", "cấp cứu", "ngã", "bất tỉnh"
];
// :139  khớp bằng qLower.includes(k)
```
Không khớp → rơi thẳng xuống Gemini free-form. Toàn bộ ràng buộc còn lại về triệu chứng là **một dòng**: *"3. Không chẩn đoán bệnh của người, chỉ nói công dụng của thuốc."*

Doc [31](31-Assistant-Conversations.md) mục 7 tự ghi việc "Danh sách từ khóa cấp cứu tiếng Việt" là 🔲 — đúng, chưa làm.

### Vì sao "đau bụng vùng nào" là câu hỏi đúng

Người dùng mẫu (Ba Mười, 68 tuổi, đang uống Amlodipine + Atorvastatin) nói: *"Bác đau bụng trên, buồn nôn, vã mồ hôi."*

- `"đau bụng"` không có trong list → không chặn.
- Đến Gemini với ngữ cảnh "đang uống thuốc huyết áp, mỡ máu" → mô hình rất dễ trả lời theo hướng tác dụng phụ tiêu hoá của statin, giọng ấm áp, và **không hỏi thêm gì**.
- Bệnh cảnh thật cần loại trừ đầu tiên ở người 68 tuổi có yếu tố nguy cơ tim mạch là **nhồi máu cơ tim thành dưới** — biểu hiện điển hình là đau thượng vị + buồn nôn + vã mồ hôi, **không** đau ngực. Danh sách keyword chỉ bắt "đau ngực" nên trượt đúng ca nguy hiểm nhất.

Các ca trượt tương tự, đều nằm ngay trong nhóm thuốc app đang seed:

| Người dùng nói | Thực tế cần loại trừ | Code hiện tại |
|---|---|---|
| "đau bụng dưới bên phải, sốt nhẹ" | viêm ruột thừa | không chặn |
| "đau bụng trên lan ra sau lưng" | viêm tụy / thủng tạng | không chặn |
| "mỏi cơ, đau bắp chân, nước tiểu sẫm" | tiêu cơ vân do **Atorvastatin** | không chặn |
| "mệt, thở nhanh, buồn nôn" (đang uống Metformin) | nhiễm toan lactic | không chặn |
| "đi cầu phân đen" | xuất huyết tiêu hoá | không chặn |

### Chưa hết: khớp chuỗi thô gây cả hai chiều lỗi

**Trượt (false negative)** — cách người già miền Nam/miền Bắc thực sự nói, không cái nào khớp:
`tức ngực` · `nặng ngực` · `khó chịu trong ngực` · `hụt hơi` · `thở không ra hơi` · `xây xẩm` · `choáng` · `méo miệng` · `yếu tay` · `nói đớ` · `nôn ra máu` · `ói ra máu` · `đi cầu ra máu`.

**Báo nhầm (false positive)** — không xử lý phủ định và thì quá khứ:
> *"Hồi năm ngoái bác bị đau ngực chứ giờ hết rồi con."* → app cắt hội thoại, bật màn đỏ, hô gọi 115.

Báo nhầm không vô hại: nó tạo **alarm fatigue**. Sau 3 lần báo nhầm, lần thứ 4 là thật thì người nhà đã bỏ qua.

### Đề xuất kiến trúc (nguyên tắc: LLM không được ra quyết định an toàn)

```
Câu có dấu hiệu triệu chứng
        ↓
[1] BỘ HỎI CẤU TRÚC — deterministic, KHÔNG dùng AI
     · vị trí (chọn trên hình người / danh sách vùng bụng, ngực, đầu, chi)
     · bắt đầu khi nào · liên tục hay từng cơn · mức độ
     · triệu chứng đi kèm: sốt / nôn / ra máu / khó thở / vã mồ hôi /
       yếu liệt / nói khó / ngất
        ↓
[2] BẢNG RED-FLAG TĨNH (JSON, phiên bản hoá, **dược sĩ duyệt**)
     · vị trí + triệu chứng kèm + tuổi + thuốc đang uống → 1 trong 3 nhánh
        ↓
[3] Ba đầu ra, cố định, không để AI ứng biến:
     🔴 CẤP CỨU     → cắt hội thoại, nút 115, gửi cảnh báo thật cho con
     🟠 KHÁM 24H    → nói rõ mốc, đặt task cho con cái
     🟢 GHI NHẬN    → log triệu chứng + báo con + lời khuyên chăm sóc
        ↓
[4] AI chỉ được gọi ở nhánh 🟢, và chỉ để DIỄN ĐẠT quyết định
     đã có sẵn cho ấm áp — không để nó chọn nhánh.
```

Điểm mấu chốt: nhánh do bảng tĩnh chọn, LLM chỉ viết lại câu. Như vậy hành vi an toàn **kiểm thử được và tái lập được**, còn hiện tại nó phụ thuộc vào việc mô hình hôm đó trả lời thế nào.

### Lựa chọn thay thế nếu không kịp trước 30/08

Thu hẹp phạm vi công khai: app là **quản lý & tuân thủ thuốc**, không nhận câu hỏi triệu chứng. Gặp triệu chứng → một câu cố định: *"Cái này con không tự trả lời được ạ. Con ghi lại và nhắn chị Lan ngay, bác gọi bác sĩ giúp con nha."*

⚠️ Chỗ này **mâu thuẫn có chủ đích với [31](31-Assistant-Conversations.md)**, nên nói rõ: lập luận "user sẽ đi hỏi ChatGPT nên app trả lời còn an toàn hơn" **đúng cho Mức 1–2** (câu hỏi về thuốc trong hồ sơ — app có lợi thế thông tin thật). Nó **không áp dụng cho triệu chứng**: ở đó app không có lợi thế thông tin nào, vì nó không khám được bệnh nhân. Trả lời nửa vời về triệu chứng, với giọng thân mật đáng tin của "cháu trong nhà", còn nguy hiểm hơn một câu trả lời chung chung của ChatGPT — vì người dùng tin nó hơn.

---

## 2. 🔴 C2 — Báo động cấp cứu nói dối

```js
// geminiService.js:145
`⚠️ Bác ơi, đây là dấu hiệu cấp cứu nguy hiểm! ...
  Con đã tự động gửi tin nhắn báo động cho gia đình rồi ạ.`
```
Không có code nào gửi. `VoiceAssistantModal.jsx:67–69` chỉ `setEmergencyAlert()` để hiện hộp đỏ. Không đụng tới `firebaseService`, không có push, không có SMS.

Đây là lỗi nghiêm trọng nhất trong toàn app: người già nghe "con đã báo cho gia đình rồi" sẽ **yên tâm và không tự gọi ai**, đúng vào tình huống mà mọi phút đều tính. Câu này biến một tính năng an toàn thành một thứ tích cực gây hại.

**Sửa tối thiểu ngay:** bỏ vế "đã gửi tin nhắn", đổi thành lời nhắc hành động của chính người dùng. Chỉ nói lại câu đó khi có write thật vào Firestore + notification đã xác nhận gửi.

---

## 3. 🔴 C3 — Hồ sơ thuốc trong prompt bị hardcode

```js
// geminiService.js:175
- Thuốc đang uống: Amlodipine 5mg (trưa), Atorvastatin 10mg (tối), Panadol Extra (khi đau).
```
Chuỗi cứng. Không đọc từ `prescriptions`.

Hậu quả: chọn **Mẹ Lan** (`mockData.js:96–104` — chỉ "Đau khớp nhẹ", không thuốc huyết áp) rồi hỏi Cháu Bi → AI vẫn tư vấn về thuốc huyết áp và mỡ máu của **Ba Mười**. Đây chính là *"uống thuốc của người khác"* mà [31](31-Assistant-Conversations.md) Mức 4 liệt vào nhóm phải chặn tuyệt đối — chỉ khác là app tự gây ra thay vì người dùng xin.

Đồng thời thiếu hẳn các trường mà doc [25](25-AI-Prompts.md) mục 0b bắt buộc nạp: lịch uống hôm nay, đã uống chưa, giờ liều kế, ngày còn lại của đợt. Không có mấy trường này thì **không thể** trả lời đúng câu quên liều — mà doc ước tính đó là ~20% câu hỏi và là ví dụ lõi của Mức 2. Hiện AI sẽ đoán thời gian.

---

## 4. 🔴 C4 — API lỗi → bịa ra một đơn thuốc, và báo "đọc thành công"

```js
// geminiService.js:49
} catch (err) {
  return getFallbackExtractionResult();   // :198 — đơn thuốc bịa sẵn
}
```
Fallback trả về một đơn hoàn chỉnh: Amlodipine 5mg + Atorvastatin 10mg, 30 ngày, kèm **tên bác sĩ và tên bệnh viện bịa** ("BS. Nguyễn Thị Mai", "Bệnh viện Đa Khoa Quốc Tế") và chẩn đoán "Tăng huyết áp độ 1 & Rối loạn lipid máu nhẹ".

Và màn xác nhận luôn hiện badge xanh, không phân biệt:
```jsx
// PrescriptionUploadWizard.jsx:100
<span …>✓ Gemini Vision đọc thành công</span>
```

Kịch bản thật: mất mạng, hoặc thiếu API key, hoặc user chụp nhầm tờ giấy bất kỳ → app hiện một đơn tim mạch trông rất thuyết phục, gắn nhãn "đọc thành công", user bấm Xác nhận → `syncPrescriptionToCalendar` đẩy thẳng lịch uống thuốc vào Google Calendar của cả nhà.

Đây là **bịa dữ liệu y tế rồi trình bày như dữ liệu đã đọc được**. Nếu ban giám khảo thử app khi rate-limit thì lộ ngay; nếu người dùng thật gặp thì hậu quả là lịch uống thuốc sai.

**Sửa:** fallback phải là **trạng thái lỗi**, không phải dữ liệu. Hiện "Không đọc được ảnh — bác nhập tay giúp con" + form nhập tay ([27](27-Risk-Register.md) R1 vốn đã chọn nhập tay làm phương án B, chỉ là chưa build).

Liên quan — **H6**, các default lấp chỗ trống cũng bịa lâm sàng:
```js
// PrescriptionUploadWizard.jsx:49–51
dosage: m.dosage || "Uống 1 viên",
timing: m.timing || "Sau ăn",
time_slot: m.timing?.includes("Sáng") ? "Sáng" : m.timing?.includes("Trưa") ? "Trưa" : "Tối",
duration_days: m.duration_days || 14,
```
AI đọc thiếu liều → app tự điền "1 viên, sau ăn, 14 ngày", và mọi thuốc không parse được giờ đều thành **cữ Tối**. Trường thiếu phải để trống và **bắt người dùng điền**, không được đoán.

---

## 5. 🔴 C5 — Golden Set là số bịa (rủi ro cho chính hồ sơ dự thi)

```js
// benchmarkService.js:54
export async function runGoldenSetBenchmark(onProgress) {
  … await new Promise(r => setTimeout(r, 400));
  const caseResult = { …testCase, status: "PASSED",
                       field_accuracy: testCase.expected_field_accuracy };
```
Không có ảnh, không có ground truth, không gọi Gemini. `expected_field_accuracy` (98.2 / 97.8 / 96.5 / 92.4 / 94.1) là hằng số viết tay ở đầu file, `status` luôn `"PASSED"`. Comment ghi *"15 real Vietnamese prescription test cases"* — trong file có **5**. Modal cũng quảng cáo "Bộ test 15 đơn thuốc thật".

Doc [25](25-AI-Prompts.md) mục 7 và [27](27-Risk-Register.md) R1 đều coi golden set là **bằng chứng an toàn chính** của bài nộp. Đưa con số ~95.8% vào bài nộp hay video demo khi nó được sinh ra như trên là **số liệu sai trong hồ sơ dự thi** — rủi ro lớn hơn nhiều so với việc không có số nào.

**Hai lựa chọn, chọn một, đừng ở giữa:**
1. Chạy thật: 15–20 ảnh đơn thật, tự ghi đáp án, so từng trường, xuất số thật (số thấp mà thật vẫn dùng được, và kể chuyện tốt hơn).
2. Gỡ modal, ghi vào bài nộp là "chưa đo — đây là việc kế tiếp".

---

## 6. 🔴 C6, C7 — Bốn chỗ app khẳng định an toàn mà không có cơ sở

| Chỗ | Câu chữ | Cơ sở thật |
|---|---|---|
| `SignatureAlertCard.jsx` (khi 0 warning) | **"An toàn 100% — Không phát hiện trùng hoạt chất & kiêng ăn"** | bộ kiểm chỉ biết **1** hoạt chất (paracetamol) và **4** thuốc trong `mockData.js` |
| `SignatureAlertCard.jsx` (mỗi warning) | "Verified by AI & **National Pharmacopeia Base**" | không tồn tại nguồn này |
| `HealthTrackerCard.jsx:69` | badge **"✓ An toàn"** hardcode trong JSX, không đọc `item.status` | không có ngưỡng nào trong code — nhập 180/110 vẫn "An toàn" |
| `FoodInteractionCard.jsx` | "Gemini AI tự động rà soát kiêng khem" | mảng hardcode, không có lời gọi AI |

Nhóm này nguy hiểm hơn nhóm thiếu tính năng: thiếu tính năng thì người dùng vẫn cảnh giác, còn "An toàn 100%" thì họ **ngừng** cảnh giác. Nó cũng va thẳng vào E1 trong [27](27-Risk-Register.md) — app không được trình bày như công cụ phán định y tế, mà câu này còn mạnh hơn một chẩn đoán.

**Sửa:** đổi sang ngôn ngữ mô tả đúng phạm vi — *"Đã đối chiếu 3 thuốc với kho 4 hoạt chất đã kiểm chứng. Kho còn hạn chế, chưa thay được lời dặn của dược sĩ."*

`HealthTrackerCard` cần thêm bảng ngưỡng tĩnh (đúng như [25](25-AI-Prompts.md) mục 6 đã chốt: *"diễn giải cao/thấp chỉ hiển thị bằng ngưỡng tĩnh có sẵn trong app, không để AI phán"* — ngưỡng đó chưa được viết).

---

## 7. 🟠 H1 — Rào an toàn trong code còn 4/35 dòng

`geminiService.js:177–181` so với [25](25-AI-Prompts.md) mục 0. **Mất hoàn toàn:**

- ❌ Không khuyên ngừng/đổi thuốc, không khuyên dùng thuốc ngoài hồ sơ (ràng buộc 3)
- ❌ Nhóm `special_missed_dose` / `narrow_therapeutic` (ràng buộc 5)
- ❌ "Không chắc thì nói thẳng, TUYỆT ĐỐI không bịa tên thuốc/công dụng/tương tác" (ràng buộc 6)
- ❌ Quy tắc cấp cứu **trong prompt** (hiện chỉ chặn bên ngoài bằng keyword — mà keyword thì thủng, xem C1)
- ❌ Kiểm tra dị ứng trước khi nói về bất kỳ thuốc nào ([25](25-AI-Prompts.md) mục 0b quy tắc 4)

Hậu quả cụ thể và nghiêm trọng nhất: dòng 179 dạy AI **quy tắc quên liều chung** ("nhớ xa giờ → uống ngay"). Không có gì loại trừ nhóm đặc biệt. Người dùng hỏi *"bác quên mũi insulin sáng"* hoặc *"quên viên chống đông"* → AI áp quy tắc chung. **Quy tắc chung áp cho warfarin/insulin là sai và có thể gây tử vong.** Doc [31](31-Assistant-Conversations.md) mục 1 Mức 2 đã cảnh báo đúng chỗ này; code bỏ mất.

---

## 8. 🟠 H2, H3, H4 — Bộ kiểm tra an toàn quá hẹp

```js
// geminiService.js:87 — toàn bộ bảng ánh xạ biệt dược → hoạt chất
if (nameLower.includes("panadol") || nameLower.includes("efferalgan")
 || nameLower.includes("hapacol") || nameLower.includes("tylenol")) {
  matchedGeneric = "paracetamol";
}
```

[30](30-Knowledge-Base.md) mục 2 gọi bảng này là *"quan trọng nhất, phục vụ T15"* và cần 50–100 thuốc. Hiện có **1 hoạt chất**. Không bắt được: trùng ibuprofen (Alaxan / Mofen / Brufen), trùng NSAID khác nhóm, trùng hai statin, trùng ACE-I + ARB, aspirin chồng thuốc chống đông.

**H2 — dị ứng không được kiểm.** `mockData.js:90` ghi Ba Mười dị ứng **Penicillin**, nhưng nó chỉ để hiển thị ở `PharmacyModeModal`. `checkSafetyWarnings()` không đọc `memberProfile` — chữ ký hàm còn không nhận profile. Scan đơn có Amoxicillin/Augmentin/Cefalexin → app **im lặng**. Đây là lỗ hổng có hậu quả tức thì (sốc phản vệ) và đồng thời **là kiểm tra dễ làm nhất trong toàn bộ danh sách này** — nên làm đầu tiên.

**H4 — không có kiểm tra tương tác thuốc–thuốc.** [25](25-AI-Prompts.md) mục 4 đã đặc tả sẵn prompt, chưa ai gọi. Chỉ có thuốc–thức ăn.

**Sai chỗ gọi:** `FamilyDashboard.jsx:23` — `checkSafetyWarnings(activeMeds, [])` truyền mảng rỗng làm `existingMedications`, tức chỉ so trong nội bộ một đơn. Nó **không chạy khi thêm đơn mới** — đúng thời điểm cần nhất, và đúng kịch bản T15 mà [29](29-Process-Audit.md) mô tả (đơn mới ở bệnh viện trùng hoạt chất với thuốc đang có ở nhà).

---

## 9. 🟠 H5 — "Human Confirm" hiện chưa confirm được gì

`PrescriptionUploadWizard.jsx:91–135`: màn tiêu đề *"Xác nhận Trích xuất AI (Human Confirm)"* chỉ **render text**. Không có một `<input>` nào. Người dùng thấy AI đọc sai liều thì lựa chọn duy nhất là bấm "Hủy" và scan lại.

[27](27-Risk-Register.md) R1 chọn màn này làm phương án dự phòng chính cho đơn viết tay, và còn định *"biến điểm yếu thành điểm mạnh về an toàn — kể thẳng trong demo: AI đề xuất, người xác nhận"*. Hiện tại demo câu đó sẽ không đứng vững.

Kèm theo: prompt trích xuất (`geminiService.js:19–36`) hardcode `"confidence": "HIGH"` như literal trong schema mẫu → mô hình có xu hướng chép lại "HIGH" cho mọi trường. Doc [25](25-AI-Prompts.md) mục 1 yêu cầu float 0.0–1.0 theo từng trường, chữ viết tay ≤0.85, và **tô vàng** trường <0.85. Không có gì trong số đó tồn tại.

---

## 10. 🟠 H7, H8 — Hai tính năng y tế đang là mock nhưng gắn nhãn "AI"

**H7 — `HealthTrackerCard.jsx:20–34`.** Nút "📷 Chụp mặt máy đo" không gửi ảnh đi đâu:
```js
setTimeout(() => {
  sys: Math.floor(120 + Math.random() * 10),
  dia: Math.floor(78 + Math.random() * 8),
  …
  setScanMessage("✓ Gemini Vision đã đọc kết quả từ máy đo: 122/80 mmHg!");
}, 1500);
```
Số trong toast (`122/80`) còn **không khớp** với số vừa random ra và lưu vào nhật ký. Đây là dữ liệu sinh hiệu bịa, được ghi vào hồ sơ sức khỏe. Giám khảo chụp máy đo của họ là lộ ngay.

**H8 — `FoodInteractionCard.jsx`.** `MOCK_FOOD_INTERACTIONS` hardcode, không đọc thuốc của member đang chọn: chọn Mẹ Lan (đau khớp) vẫn hiện cảnh báo Metformin/Glucophage mà bà không uống — trong khi `mockData.js` đã có sẵn `food_interactions` thật để dùng.

Một mục sai về dược lý: *"Lipitor ↔ thức ăn nhiều chất béo bão hòa → giảm hiệu quả hạ mỡ máu"* — đây không phải tương tác thuốc–thức ăn, và khuyến nghị kèm theo ("dùng thuốc vào buổi tối") không liên quan tới lý do nêu ra. Tương tác thật cần cảnh báo của atorvastatin là **bưởi** — đã có trong `mockData.js:52–56` nhưng không hiện ở card này.

Lỗi chữ ngay trên nhãn nguy hiểm nhất: **"🚫 CƠ NGUY CAO"** → "NGUY CƠ CAO".

---

## 11. 🟡 M1, M2, M3

**M1 — không có disclaimer.** `grep -rni "disclaimer|không thay thế|tham khảo"` trên toàn `src/` → **0 kết quả**. [27](27-Risk-Register.md) R10 yêu cầu "disclaimer thường trực". Cần tối thiểu: chân màn hình app ba mẹ, chân `PharmacyModeModal`, và dưới mỗi cảnh báo an toàn.

**M2 — `PharmacyModeModal.jsx:22–23`:**
```js
const rxMeds = activeMeds.filter(m => m.type === 'RX' || (!m.type && m.name.toLowerCase().includes('5mg')));
```
Thiếu `type` thì thuốc 10mg bị xếp thành OTC. Đây là màn **đưa cho dược sĩ xem**, phân loại sai ở đó có hậu quả thật.

**M3 — `geminiService.js`:** không set `temperature`, không dùng `responseSchema`. Mặc định Gemini là 1.0 → đang **trích xuất liều thuốc ở temperature 1.0**, trong khi [25](25-AI-Prompts.md) mục 8 chốt ~0.2 cho trích xuất và bắt buộc structured output. Parse bằng `.replace('```json','')` + `JSON.parse` không có retry ([25](25-AI-Prompts.md) mục 8 yêu cầu thử lại 1 lần rồi chuyển nhập tay).

---

## 12. Thứ tự đề xuất xử lý

**Nhóm 1 — không tốn thời gian, xoá rủi ro lớn nhất (nửa ngày):**
1. C2 — bỏ câu "đã gửi tin cho gia đình"
2. C4 — fallback thành trạng thái lỗi, không thành đơn thuốc bịa
3. C6/C7 — bỏ "An toàn 100%", "National Pharmacopeia Base", badge "✓ An toàn" cứng
4. C5 — gỡ modal benchmark **hoặc** chạy thật; không để số hardcode xuất hiện trong bài nộp
5. M1 — thêm disclaimer

**Nhóm 2 — sửa cái đang sai về logic (1–2 ngày):**
6. C3 — nạp hồ sơ thật của member đang chọn vào prompt (kèm lịch uống hôm nay)
7. H1 — dán lại đủ rào an toàn mục 0 của doc 25, đặc biệt nhóm `special_missed_dose`
8. H2 — kiểm dị ứng đối chiếu đơn mới ← *hiệu quả/công sức tốt nhất trong cả danh sách*
9. H5/H6 — cho sửa tay ở màn confirm; bỏ default bịa

**Nhóm 3 — việc lõi, cần thời gian và cần người có chuyên môn:**
10. C1 — bộ hỏi cấu trúc + bảng red-flag tĩnh (hoặc quyết định thu hẹp phạm vi)
11. H3 — mở rộng bảng ánh xạ biệt dược lên 50–100 thuốc
12. H4 — tương tác thuốc–thuốc
13. H7/H8 — nối vào Gemini thật hoặc gắn nhãn "demo" rõ ràng

**Việc không code được — nhưng đáng giá nhất:** [30](30-Knowledge-Base.md) mục 6 và [31](31-Assistant-Conversations.md) mục 7 đều đã ghi 🔲 *"nhờ một dược sĩ thật rà"*. Với đúng mối lo Thanh đặt ra, đây là hạng mục có giá trị cao nhất còn lại — vừa là an toàn thật, vừa là điểm mạnh trong bài nộp mà không đội nào tự code ra được.
