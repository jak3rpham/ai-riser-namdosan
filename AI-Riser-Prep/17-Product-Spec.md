# 17 — Product Spec (v0.1 — CHỜ THANH DUYỆT)

> Trạng thái: **DRAFT**. Các mục cần Thanh quyết có đánh dấu 🔲. Mọi lý do thiết kế ghi kèm tại chỗ + tổng hợp trong [19-Decision-Log.md](19-Decision-Log.md).

---

## 1. Tên sản phẩm — 🔲 CHƯA CHỐT (cần vòng đặt tên riêng)

**Trạng thái 10/08:** Thanh chưa chốt. Lý do: tên **quan trọng** và **tên app quyết định tên trợ lý giọng nói** (coupling) — chọn vội là sai cả hai. "An Khang" chỉ là placeholder trong tài liệu/prototype, KHÔNG phải quyết định.

**Tiêu chí đặt tên (đã thống nhất):**
- Người già **đọc được, nhớ được** → ưu tiên tiếng Việt, loại tên tiếng Anh khó đọc.
- Gợi được *sức khỏe + gia đình/an tâm*.
- 2–3 âm tiết, làm logo/icon đẹp, tên miền & tên app store còn trống.
- **Đẻ ra được tên trợ lý** 1 âm tiết dễ gọi (kiểu "An Khang" → "Khang ơi").

### Vòng đặt tên v2 — Thanh chốt hướng: **phải có chữ "NHÀ"** 🔲

| Tên | Nghĩa & sức nặng | Tên trợ lý đi kèm | Ghi chú |
|---|---|---|---|
| **Nhà Mình** ⭐⭐ | Chính xác cái người Việt gọi gia đình mình. Ấm nhất, ai cũng hiểu ngay, không cần giải thích. "Nhà mình hôm nay thế nào?" = đúng câu app trả lời mỗi ngày | đặt riêng (xem dưới) | Rủi ro: hơi phổ thông, khó bảo hộ thương hiệu |
| **An Nhà** ⭐⭐ | *An* = an tâm, bình an, an khang → đúng thứ con cái mua ([22](22-Business-Model.md)). Ngắn, hiện đại | **"An"** — *"An ơi, chiều nay tôi uống thuốc gì?"* ✓ hoàn hảo | Coupling tên app ↔ trợ lý đẹp nhất |
| **Nhà Yên** ⭐ | Yên = yên ổn, yên lòng. Dịu, không ồn ào | **"Yên"** — *"Yên ơi..."* ✓ | Nhẹ nhàng, hơi trầm |
| **Nhịp Nhà** | *Nhịp* = nhịp sinh hoạt + **nhịp tim**. Hiện đại, hợp hướng "futuristic" | khó gọi ✗ | Sáng tạo nhưng trừu tượng với người già |
| **Khỏe Nhà** | Trực diện, dễ hiểu công dụng | — | An toàn nhưng ít cảm xúc |
| ~~Nhà Thương~~ | Chơi chữ hay (*nhà thương* = bệnh viện cũ + *nhà của sự thương yêu*) | — | ⚠️ **Rủi ro:** "nhà thương" gợi bệnh viện/bệnh tật, có cụm tiêu cực → loại |

**Ý tưởng đặt tên trợ lý (độc lập với tên app):** dùng **tên gọi thân mật kiểu cháu trong nhà** — *Bi, Bo, Cún, Mít, Bơ*. Khi một bác 68 tuổi gọi *"Bi ơi"*, cảm giác như gọi đứa cháu chứ không phải ra lệnh cho máy. Đây là chi tiết văn hóa **không app ngoại nào có** — và rất đáng kể trong demo.
- Nếu chọn **An Nhà** → trợ lý tên "An" (thống nhất, sang).
- Nếu chọn **Nhà Mình** → trợ lý tên "Bi"/"Bo" (ấm, đời thường).

→ 🔲 Thanh chọn 1 tên app + 1 tên trợ lý. Tài liệu & prototype tạm dùng **"Nhà Mình"** làm placeholder.

## 1b. 🌐 Song ngữ Việt – Anh (yêu cầu mới 10/08)
Toàn bộ **app + web dashboard** hỗ trợ **tiếng Việt (mặc định) và tiếng Anh (đầy đủ, không cắt xén)**.
- Chuyển ngôn ngữ ở cấp **người dùng**, không phải cấp gia đình: con cái có thể xem tiếng Anh trong khi app của ba mẹ vẫn tiếng Việt.
- **Nội dung do AI sinh** (giải thích thuốc, cảnh báo kiêng ăn, trả lời trợ lý) sinh theo ngôn ngữ người đang xem → cache theo `(nội_dung, ngôn_ngữ)`.
- **Tên thương hiệu giữ nguyên tiếng Việt** ở cả 2 bản (như Nest/Grab/Zalo) + mô tả tiếng Anh đi kèm.
- *Reasoning:* (1) mở đường ĐNÁ/quốc tế trong luận điểm scalability; (2) **giám khảo cuộc thi có người nước ngoài / quen dùng EN** → bản EN giúp chấm dễ; (3) chi phí thấp nếu làm i18n từ đầu, rất đắt nếu thêm sau.

## 2. Personas

| Persona | Ai | Nỗi đau | Dùng gì |
|---|---|---|---|
| **P1 — "Người giữ nhịp"** (primary) | Con cái 25–45 tuổi, đi làm xa/bận, rành công nghệ | Lo ba mẹ quên thuốc, không hiểu đơn bác sĩ, gọi Zalo hỏi thì ba mẹ kể không rõ | **Web dashboard** (+ app khi cần) |
| **P2 — "Người được chăm"** | Ba mẹ 55+, dùng smartphone mức Zalo/YouTube | Đơn thuốc chữ khó hiểu, nhiều loại thuốc dễ nhầm/quên, ngại phiền con | **App Android** (nút to, voice) |
| **P3 — "Người trẻ tự quản"** *(BONUS — không focus)* | 22–35 tuổi, bệnh mãn nhẹ | Mất xét nghiệm cũ, lười ghi chép | Web + app |

**Cập nhật 10/08 (vòng feedback 1):** Thanh chốt **TA chính = P1 + P2** (con cái + ba mẹ). P3 chỉ là bonus tự nhiên có được nhờ kiến trúc — không thiết kế riêng, không ưu tiên. Sản phẩm phải thắng ở bài toán chăm sóc người lớn tuổi.

### 2b. P2 không đồng nhất — "Bậc thang khả năng" (capability profile)
Người lớn tuổi chia nhiều dạng → mỗi member gắn 1 **capability profile** lúc onboarding, UI app tự thích ứng:

| Mức | Khả năng | App hiển thị/hành xử |
|---|---|---|
| C1 | Tự nhập được (gõ) | Đầy đủ tính năng, có thể tự thêm ghi chú |
| C2 | Chụp được, ngại gõ | Camera-first; mọi nhập liệu = chụp ảnh |
| C3 | Không tự input được | App **receive-only**: nhận nhắc + bấm nút to; mọi quản lý do con làm trên web |
| C4 | **Không đọc được chữ** | **Voice-first + hình ảnh**: mọi thứ đọc to bằng giọng nói; thuốc nhận diện bằng **ảnh chụp viên/vỉ thuốc thật của nhà mình** thay vì tên chữ; xác nhận bằng giọng ("Dạ uống rồi") |
- *Reasoning:* đây là điểm ăn **theme Inclusive Access (#9)** chồng lên Healthcare (#1) — accessibility là điểm cộng chấm thi lẫn impact thật. Ảnh viên thuốc thật làm định danh là chi tiết "ít app nào làm" mà người không biết chữ cần nhất.

## 3. Kiến trúc trải nghiệm 2 mặt
```
WEB (P1/P3 — người quản lý)                    APP ANDROID (P2 — người được chăm)
─ Nhập liệu phức tạp dồn hết về đây            ─ Gần như chỉ NHẬN, không nhập
─ Chụp/upload tài liệu y tế                    ─ Nhắc thuốc màn hình to + giọng nói
─ Quản lý hồ sơ nhiều thành viên               ─ 1 nút mic hỏi AI về thuốc CỦA MÌNH
─ Xem dashboard tuân thủ, cảnh báo             ─ 1 nút "Báo con: Ba/Mẹ ổn ❤️"
        └──────────── Firestore sync (cùng Google account/family) ────────────┘
```
**Lý do:** luật thiết kế #1 (zero-input phía người già); web+app tồn tại vì 2 vai trò khác nhau — điểm khác biệt cấu trúc của sản phẩm.

## 4. User flows chính (MVP)

### F1 — Tạo gia đình & mời thành viên (web)
1. Sign in with Google (1 consent duy nhất: Calendar + Tasks) → 2. Tạo "Gia đình" → 3. Thêm thành viên (tên gọi thân mật, năm sinh, quan hệ, ảnh đại diện) → 4. Mời qua link/QR — người được mời sign in Google là tự vào đúng gia đình → 5. Gắn vai trò: *quản lý* / *được chăm sóc* / *tự quản*.
- *Reasoning:* vai trò gắn theo **thành viên trong gia đình**, không phải loại account → 1 người có thể vừa tự quản mình vừa quản lý ba mẹ.

### F2 — Nhập đơn thuốc (web) — flow lõi
1. Chụp/upload ảnh đơn → 2. Gemini vision trích xuất **1 lần** ra JSON cấu trúc (thuốc, liều, thời điểm, thời hạn, bác sĩ, chẩn đoán ghi trên đơn) → 3. **Màn hình xác nhận**: hiển thị kết quả trích xuất cạnh ảnh gốc, field nào AI không chắc thì highlight vàng → user sửa/confirm → 4. Lưu Firestore + tự sinh lịch uống thuốc → 5. Tab "Giải thích bình dân" cho từng thuốc.
- *Reasoning bước 3 (human-confirm):* dữ liệu y tế sai = nguy hiểm → AI đề xuất, người xác nhận. Đây cũng là câu trả lời đẹp khi giám khảo hỏi "AI sai thì sao?" — điểm feasibility.
- *Reasoning "giải thích bình dân":* giá trị cảm nhận ngay lập tức, demo rất "wow", chi phí chỉ 1 call/đơn (cache lại).

### F3 — Nhắc & xác nhận uống thuốc (app)
1. Đến giờ → notification + màn hình thẻ thuốc TO (tên gọi dễ hiểu "viên huyết áp màu trắng", ảnh, liều) → 2. Bấm **"✓ Đã uống"** (1 chạm) → 3. Ghi adherence log → web của con thấy real-time → 4. Quên quá X phút → nhắc lại; quên quá Y lần → cảnh báo cho người quản lý.
- *Reasoning:* nút xác nhận 1 chạm là mức thao tác tối đa chấp nhận được với P2; adherence log = nguồn số liệu engagement để nộp bài.

### F4 — Voice Q&A (app)
1. Bấm nút mic to → hỏi bằng tiếng Việt ("thuốc này uống trước hay sau ăn?", "chiều nay uống gì?") → 2. Gemini trả lời **chỉ dựa trên hồ sơ của chính người hỏi** (RAG trên Firestore) → 3. Đọc to câu trả lời + hiện text to.
- *Reasoning:* giới hạn context = hồ sơ cá nhân → không "chẩn đoán lung tung", token bounded, an toàn pháp lý. Câu ngoài phạm vi → "Bác hỏi bác sĩ giúp con nhé" + gợi ý phòng khám gần (Maps).

### F5 — Tủ thuốc & cảnh báo (web, tự động)
1. Mỗi thuốc lưu vào tủ với hạn dùng (nếu chụp được) → 2. Cron check hạn dùng → cảnh báo trước 30 ngày → 3. Khi thêm thuốc mới: check **tương tác thuốc** với danh sách đang dùng — tra `interactions_cache` trước, miss thì hỏi Gemini 1 lần rồi cache.
- *Reasoning cache:* cặp thuốc phổ biến lặp lại nhiều giữa các gia đình → càng dùng càng rẻ & nhanh (đúng ý Thanh về DB tự dày).

## 4b. Bài toán khó & lời giải đề xuất (vòng feedback 1 — 10/08) 🔲

### B1 — Uống rồi nhưng quên bấm xác nhận trong app
Nguy cơ: hệ thống báo "quên thuốc" giả → con hoảng, ba mẹ bị làm phiền → mất niềm tin cả hai phía.
**Giải pháp nhiều lớp (triết lý: đo "AN TÂM", không phải "GIÁM SÁT"):**
1. **Grace window:** quá giờ X phút mới nhắc lại nhẹ nhàng, không báo động ngay.
2. **Hỏi bằng giọng nói:** thay vì chờ bấm, app chủ động hỏi to "Ba uống thuốc sáng chưa ạ?" → trả lời miệng "rồi" là xong (hợp C4).
3. **Xác nhận hộ:** con gọi điện hỏi thăm như bình thường → tick giùm trên web ("xác nhận qua điện thoại").
4. **Chế độ tracking-lite theo member:** người tự giác uống đều → chỉ nhận nhắc, KHÔNG theo dõi từng liều → không bao giờ có cảnh báo giả. Cuối ngày hỏi đúng 1 lần "hôm nay ba uống đủ thuốc chưa?".
- *Reasoning:* chấp nhận dữ liệu adherence "mềm" để giữ được lòng tin — sản phẩm chăm sóc mà gây cảm giác bị theo dõi là chết từ ngày 2.

### B2 — Liều lượng cá nhân hóa theo từng người/bệnh/cơ thể
**Nguyên tắc CỨNG:** app **không bao giờ** gợi ý/điều chỉnh liều. Nguồn sự thật duy nhất = toa bác sĩ đã được confirm. AI chỉ giải thích "thuốc này là gì, uống đúng toa như thế nào, kiêng gì" — tuyệt đối không "bạn nên uống X mg". Dị ứng/bệnh nền của member chỉ dùng để **cảnh báo mang đi hỏi bác sĩ**, không để tự đổi liều.
- *Reasoning:* an toàn + pháp lý + chính xác về mặt y khoa (mỗi cơ thể một toa — đúng như Thanh nói). Đây cũng là câu trả lời chuẩn khi giám khảo hỏi về rủi ro y tế.

### B3 — Toa thuốc mỗi nơi kê một kiểu (in, viết tay, format khác nhau)
1. Prompt trích xuất kèm **few-shot các format toa VN** (toa in bệnh viện, toa viết tay phòng khám, **túi giấy nhà thuốc có in liều** — hỗ trợ chụp cả túi thuốc, không chỉ toa).
2. Fuzzy-match tên thuốc với `med_catalog` (biệt dược ↔ hoạt chất) để chuẩn hóa.
3. Confidence per field + màn confirm (đã có ở F2) là lưới an toàn cuối.
4. Luôn có **nhập tay fallback**; case trích xuất fail được log lại → cải thiện prompt (và thành số liệu "học từ thực tế" để kể trong bài nộp).

### B4 — Theo dõi sức khỏe tổng thể như thế nào (ngoài thuốc)
Giữ đúng luật input đồng nhất: **chụp ảnh mặt máy đo** (máy huyết áp/đường huyết điện tử nhà nào cũng có) → Gemini vision đọc số → lưu chỉ số theo member → xu hướng dạng text đơn giản ("huyết áp tuần này ổn định quanh 130/85").
- Nhật ký triệu chứng bằng giọng nói: "hôm nay ba thấy chóng mặt" → log có tag.
- **Killer output:** trước ngày tái khám, tự tổng hợp **"Bản tóm tắt cho bác sĩ"** (tuân thủ thuốc + chỉ số + triệu chứng trong kỳ) — con in ra/mở QR cho bác sĩ xem. Bác sĩ VN khám 3 phút/người, tờ tóm tắt này là giá trị thật.
- *Scope:* MVP chỉ cần ảnh máy đo + nhập tay; symptom voice log và doctor summary để V2 nếu thiếu thời gian. 🔲

## 5. Feature list đầy đủ 🔲

### MVP (bản thi — phải xong trước 25/08)
| ID | Tính năng | Mặt | Google tech |
|---|---|---|---|
| M1 | Sign in + gia đình + thành viên + vai trò | Web+App | Firebase Auth |
| M2 | Chụp đơn thuốc/xét nghiệm → trích xuất + confirm | Web | Gemini vision |
| M3 | Giải thích bình dân từng tài liệu/thuốc | Web+App | Gemini (1-shot, cache) |
| M4 | Hồ sơ thành viên: timeline tài liệu + thuốc đang dùng + dị ứng/bệnh nền | Web | Firestore |
| M5 | Lịch uống thuốc tự sinh + sync Calendar/Tasks + notification — **kèm M18 vòng đời đợt thuốc** (đợt/dài hạn/khi cần, tự ngừng nhắc khi hết đợt, ước viên còn lại → nhắc mua; chi tiết [21 mục 1](21-UI-Exploration.md)) | Web+App | Calendar, Tasks |
| M6 | Màn hình app P2: nhắc thuốc thẻ to + nút "Đã uống" | App | Firestore |
| M7 | Voice companion **"Jarvis-lite"** — hội thoại giọng nói về hồ sơ cá nhân, persona tên riêng, kích hoạt bằng nút (phân tích khả thi: [21 mục 2](21-UI-Exploration.md)) | App | Gemini **Live API** (fallback STT→Gemini→TTS) |
| M8 | Nút "Báo con: ổn" + feed trạng thái bên web | App→Web | Firestore |
| M9 | Tủ thuốc: hạn dùng + cảnh báo tương tác (cache) | Web | Gemini + Firestore |
| M10 | Tìm nhà thuốc/phòng khám gần | Web+App | Maps grounding |
| M11 | Dashboard người quản lý: adherence, sắp tới, cảnh báo | Web | Firestore |

### ➕ Mở rộng vòng feedback 1 (10/08) — đề xuất đưa vào MVP 🔲
| ID | Tính năng | Mặt | Ghi chú |
|---|---|---|---|
| **M12 ⭐** | **"Kiêng gì khi uống thuốc"** — cảnh báo tương tác **THUỐC ↔ THỨC ĂN**: mỗi thuốc active sinh danh sách món nên tránh + thay thế an toàn, lời bình dân ("Ba đang uống thuốc mỡ máu — tuần này đừng ăn bưởi nha") | Web+App | **Signature feature** — "thứ ít pharma nào suggest" (lời Thanh). Cache theo hoạt chất trong `med_catalog.food_interactions` → 1 call/thuốc/đời app. Ví dụ seed: statin↔bưởi, warfarin↔rau vit-K, huyết áp↔mặn/cam thảo, kháng sinh↔sữa |
| M13 | Capability profile per member (C1–C4, mục 2b) + voice-first mode cho C4 | App | Ăn theme Inclusive Access |
| M14 | Tracking-lite + xác nhận hộ + hỏi bằng giọng (giải pháp B1) | Web+App | Triết lý "an tâm ≠ giám sát" |
| M15 | Chụp **túi thuốc nhà thuốc** (không chỉ toa) + nhập tay fallback | Web | Giải B3 |
| M16 | Maps nâng cấp: nhà thuốc/phòng khám/bệnh viện gần + lọc **bình dân ↔ cao cấp**, còn mở cửa, trực đêm | Web+App | Ý Thanh; Maps grounding có đủ place data |
| M17 | Chụp ảnh mặt máy đo huyết áp/đường huyết → lưu chỉ số + xu hướng text | Web | Giải B4 (phần MVP) |

### V2 (roadmap — chỉ ghi vào pitch, KHÔNG code)
SOS 1 chạm · nhật ký triệu chứng bằng giọng · **"Bản tóm tắt cho bác sĩ"** trước tái khám (in/QR) · widget màn hình chính Android (liều kế tiếp, zero mở app) · notification theo ngữ cảnh (trời lạnh → nhắc đo huyết áp) · nhắc mua thêm thuốc (đếm viên còn lại) · digest tối cho con · nhắc tiêm chủng trẻ em · chia sẻ hồ sơ cho bác sĩ link tạm · gói gia đình premium · **app chăm cây** (tái dùng pipeline).
- *Reasoning cắt MVP:* M1–M11 khép kín vòng giá trị; M12–M17 là vòng mở rộng theo feedback — nếu áp lực thời gian, thứ tự ưu tiên giữ lại: **M12 (signature) > M13–M14 (accessibility+trust) > M15 > M16 > M17**. 🔲 Thanh duyệt thứ tự này.

## 6. AI pipeline (chi tiết cho Antigravity)
```
Ảnh tài liệu → Gemini vision (structured output theo JSON schema cố định)
  → confidence per field → UI confirm (field không chắc = highlight)
  → lưu documents + medications + schedules (Firestore)
  → sinh explanation 1 lần (cache theo document)
Voice Q&A: STT → Gemini + context = hồ sơ member (system prompt khóa phạm vi) → TTS
Interaction check: cặp thuốc chuẩn hóa → interactions_cache → (miss) Gemini → cache
```
- JSON schema trích xuất: `{patient, doctor, facility, date, diagnosis_text, medications[{name, generic_name?, strength, form, dosage, frequency, timing(trước/sau ăn), duration_days, quantity, notes, confidence}]}`
- *Reasoning structured output:* ép schema → downstream code ổn định, đo lường được độ chính xác theo field.

## 7. Firestore data model (v0)
```
users/{uid}: name, photo, families[]
families/{fid}: name, created_by
families/{fid}/members/{mid}: display_name, birth_year, relation, role, linked_uid?, allergies[], conditions[], capability(C1|C2|C3|C4), tracking_mode(full|lite)
families/{fid}/members/{mid}/documents/{docId}: type(đơn thuốc|xét nghiệm|khác), image_ref, extracted(json), explanation, status(pending_confirm|confirmed), created_at
families/{fid}/members/{mid}/medications/{medId}: catalog_ref, custom_name("viên huyết áp trắng"), strength, timing, schedule_ref, active, expiry_date, course_type(đợt|dài_hạn|khi_cần), start_date, duration_days?, end_date?, quantity_prescribed?, est_remaining?
families/{fid}/members/{mid}/schedules/{sid}: med_refs[], times[], calendar_event_id?, task_id?
families/{fid}/members/{mid}/adherence/{date}: doses[{time, status(taken|missed|late), confirmed_at}]
families/{fid}/status_feed/{id}: member_ref, type("ok"|"help"), created_at
med_catalog/{slug}: names[], generic, common_uses_plain, cautions_plain, food_interactions[{food, severity, plain_explanation, alternatives}], source(seed|extracted), verified(bool)   ← DB chung tự dày
members/{mid}/medications thêm: photo_ref (ảnh viên/vỉ thuốc THẬT — định danh hình ảnh cho người không đọc được chữ, C4)
members/{mid}/vitals/{date}: type(huyết áp|đường huyết|cân nặng), values, source(photo|manual), image_ref?
interactions_cache/{pairHash}: severity, plain_explanation, checked_at
```
- *Reasoning `med_catalog` tách riêng cấp global:* dùng chung mọi gia đình (đúng ý Thanh: mỗi lần chụp là DB giàu lên + developer seed sẵn); field `verified` để phân biệt seed đã kiểm với dữ liệu máy trích.

## 7b. 🔑 Ba mẹ KHÔNG có tài khoản Gmail thì sao? (Thanh hỏi 11/08)

**Trả lời: được — dùng tài khoản ẩn danh + mã mời. Đúng như Thanh nghĩ.**

Firebase Auth có **Anonymous Authentication**: tạo được một danh tính (UID) hợp lệ **không cần email, không cần mật khẩu, không cần Gmail**.

**Luồng thực tế:**
```
1. Con cái (đã đăng nhập Google trên web) tạo hồ sơ "Ba Hùng" + cấu hình xong
2. Web sinh MÃ MỜI (link Zalo / QR)
3. Trên điện thoại ba mẹ: mở app → signInAnonymously() → nhận mã mời
   → thiết bị được gắn cứng vào đúng thành viên "Ba Hùng" trong gia đình
4. Từ đó app tự mở đúng hồ sơ. Ba mẹ KHÔNG BAO GIỜ thấy màn hình đăng nhập.
```

| Vấn đề | Xử lý |
|---|---|
| Xóa app / đổi máy → mất danh tính ẩn danh | **Dữ liệu vẫn nằm ở Firestore**, không mất. Con cái cấp lại mã mời là xong |
| Cài app từ Play Store vẫn cần tài khoản Google **trên máy** | Máy Android ở VN gần như luôn có sẵn (cửa hàng hoặc con cái cài lúc mua). Nếu hoàn toàn không có → con cái cài hộ khi cầm máy (Case A trong [21](21-UI-Exploration.md)) |
| Bảo mật của tài khoản ẩn danh | Quyền bị **giới hạn cứng**: chỉ đọc hồ sơ của chính mình + ghi log "đã uống". Không sửa được đơn thuốc, không xem được thành viên khác ([23](23-Security-Privacy.md)) |
| Muốn nâng cấp sau này | Firebase cho phép **liên kết** tài khoản ẩn danh với Google account mà không mất dữ liệu |

### ⚠️ Vấn đề Thanh phát hiện (11/08): tài khoản ẩn danh thì kết nối Calendar kiểu gì?
**Đúng — tài khoản ẩn danh KHÔNG gọi được Google Calendar/Tasks** (không có danh tính Google → không có OAuth scope).

**Lời giải: đặt tích hợp Workspace ĐÚNG PHÍA — bên con cái, không phải bên ba mẹ.**

| | Ba mẹ (ẩn danh) | Con cái (đăng nhập Google) |
|---|---|---|
| Nhắc uống thuốc | **Báo thức cục bộ trên máy** (AlarmManager) + Firestore | — |
| Google Calendar | ❌ không cần | ✅ lịch tái khám vào Calendar **của con** |
| Google Tasks | ❌ không cần | ✅ việc cần làm (mua thêm thuốc) vào Tasks **của con** |
| Cần thao tác kết nối thủ công? | **Không** | Không — 1 lần consent lúc đăng nhập |

*Reasoning:* nhắc thuốc vốn **không nên** phụ thuộc Calendar — nó phải chạy được cả khi mất mạng ([24](24-Scale-Cost-Control.md), T26 trong [29](29-Process-Audit.md)). Còn Calendar/Tasks phục vụ đúng người cần *lập kế hoạch*: con cái. Vậy nên hạn chế của tài khoản ẩn danh **không cản trở gì cả** — chỉ cần đặt đúng chỗ.

> 🗄️ Nếu ba mẹ **có sẵn** Google account và muốn lịch khám hiện trong app Lịch của họ → cho phép nâng cấp từ ẩn danh lên Google account (Firebase link account). **Tùy chọn, không làm ở MVP.**

*Reasoning:* đây là mảnh ghép cuối làm cho nguyên tắc "ba mẹ không thao tác setup gì" trở thành hiện thực kỹ thuật, chứ không chỉ là mong muốn thiết kế.

## 7c. ⚖️ Cân nặng, chiều cao & liều lượng (Thanh nêu 11/08)

Thanh đúng về mặt y khoa: **liều thuốc và nhu cầu dinh dưỡng phụ thuộc cân nặng, chiều cao, tuổi, chức năng gan thận**. Nhưng chính điều đó **củng cố** nguyên tắc cứng, chứ không phá nó:

| App **CÓ** làm | App **KHÔNG** làm |
|---|---|
| Lưu cân nặng/chiều cao vào hồ sơ thành viên | ❌ Tính liều theo cân nặng |
| Theo dõi **xu hướng cân nặng** (sụt cân ở người già = dấu hiệu cảnh báo cần đi khám) | ❌ Gợi ý tăng/giảm liều |
| Dùng cho **gợi ý dinh dưỡng chung** (kết hợp M12 kiêng ăn) | ❌ Nói "liều này quá cao/thấp với bác" |
| **Giải thích cho người dùng hiểu vì sao**: *"Liều thuốc được bác sĩ tính riêng theo cân nặng, tuổi và sức khỏe gan thận của từng người — nên đơn của bác không giống đơn người khác, dù cùng bệnh."* | ❌ So sánh đơn của người này với người khác |

*Reasoning:* biến giới hạn thành **giáo dục người dùng**. Câu giải thích trên vừa an toàn về pháp lý, vừa dạy người dùng một điều đúng và hữu ích (không tự ý uống thuốc theo đơn của người khác — một thói quen phổ biến & nguy hiểm ở VN). Đây cũng là một **thông điệp hay để đưa vào demo**.

> 🔲 Cân nhắc V2: cảnh báo khi liều nằm ngoài khoảng thông thường — **rủi ro báo động giả cao**, cần dược sĩ thật kiểm duyệt trước khi làm. Không làm trong MVP.

## 8. Scope & consent
- Firebase Auth + Firestore: không consent gì thêm.
- Calendar + Tasks: consent nhẹ, 1 lần. **Không xin Gmail** (restricted — [15](15-Google-Ecosystem.md)).
- Notification: quyền notification Android chuẩn.

## 9. Token economics (ước tính/đơn vị)
| Sự kiện | Tần suất | Call AI |
|---|---|---|
| Nhập 1 tài liệu | vài lần/tháng/thành viên | 1 vision + 1 explanation |
| Thêm thuốc mới | theo tài liệu | 0–1 (cache hit thì 0) |
| Nhắc thuốc + Đã uống | hằng ngày | **0** |
| Voice Q&A | khi user chủ động | 1/câu |
| Dashboard/feed | hằng ngày | **0** |
→ Vận hành ngày thường ≈ 0 token; chi phí tỷ lệ với *giá trị mới nhập vào* — pass luật #3.

## 10. Đóng khung pháp lý (bắt buộc trong copy app)
- App **"giúp bạn hiểu và tổ chức thông tin y tế của mình — không thay thế bác sĩ"**. Không chẩn đoán, không kê/đổi liều.
- **Nguyên tắc cứng B2:** không bao giờ gợi ý liều lượng — liều duy nhất là toa bác sĩ đã confirm (mỗi người/bệnh/cơ thể một toa riêng). Cảnh báo (tương tác thuốc, dị ứng) luôn kết bằng "hỏi bác sĩ/dược sĩ", không tự kết luận.
- Câu hỏi ngoài hồ sơ → từ chối mềm + điều hướng cơ sở y tế (Maps).
- Disclaimer hiển thị ở onboarding + chân màn hình giải thích.

## 11. Demo script 2 phút (draft v1) 🔲
1. *(0:00–0:15)* Hook: "Ba tôi uống 6 loại thuốc mỗi ngày. Tôi ở cách nhà 1.700km." — vấn đề bằng 1 câu.
2. *(0:15–0:45)* **Web:** chụp đơn thuốc thật → AI trích xuất + highlight field cần xác nhận → confirm → lịch thuốc tự sinh, đẩy vào Calendar.
3. *(0:45–1:20)* **App (quay điện thoại thật):** notification reo → màn hình thẻ thuốc to → bấm "Đã uống" → *cắt cảnh* web bên kia cập nhật real-time. Ba bấm mic hỏi "thuốc này uống sau ăn hả con?" → AI trả lời bằng giọng nói.
4. *(1:20–1:40)* Nút "Báo con: Ba ổn ❤️" → feed bên web. Cảnh báo tương tác thuốc + hạn dùng trong Tủ thuốc.
5. *(1:40–2:00)* Số liệu user thật ("N gia đình, M đơn thuốc, X% uống đúng giờ") + tech stack 100% Google + tầm nhìn roadmap. Logo + tên.
- *Reasoning:* mở bằng cảm xúc cá nhân thật (giám khảo nhớ câu chuyện, không nhớ feature list); mỗi cảnh demo đúng 1 tích hợp Google.

## 12. Việc Thanh cần duyệt 🔲
1. **Tên** (mục 1 — t đề xuất "An Khang").
2. **MVP list M1–M11** (mục 5 — có cắt/thêm gì không?).
3. **Style UI** — xem prototype 3 hướng: [18-Style-Prototype.md](18-Style-Prototype.md).
4. Demo script v1 (mục 11).
