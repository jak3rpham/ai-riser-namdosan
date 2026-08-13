# 38 — Backend & Bảo mật cho sản phẩm thật

> **Đổi khung tham chiếu (Thanh, 12/08):** *"vision của t treat sản phẩm này không phải là để thi mà t đang thực sự cố gắng làm một cái app có thể dùng và có thể tin tưởng."*
>
> Doc này thay thế giả định "app chạy hoàn toàn phía trình duyệt" ở [36](36-Google-Integration.md). Khi đã là sản phẩm thật xử lý dữ liệu sức khỏe của người thật, **backend không còn là tuỳ chọn**.

---

## 0. Vì sao bắt buộc phải có backend

Không phải vì kiến trúc đẹp. Vì bốn thứ sau **không thể** làm ở phía trình duyệt:

| Cần | Vì sao client không làm được |
|---|---|
| **Nhắc uống thuốc chạy nền** | Cần refresh token của Google, sống lâu dài. Token đó **không được** để ở trình duyệt. Không có nó thì app chỉ nhắc khi người dùng đang mở app — tức là không nhắc |
| **Giấu khoá Gemini/Maps** | Khoá `VITE_*` nằm trong bundle, ai cũng đọc được. Với sản phẩm thật, đó là hoá đơn của người khác tiêu |
| **Nhật ký truy cập (audit log)** | Client tự ghi log về chính mình thì log vô giá trị. Phải ghi ở nơi client không sửa được |
| **Kiểm chứng đồng thuận & quyền** | Rule của Firestore không đủ diễn đạt các luật kiểu "ba mẹ đã rút đồng thuận cho con thứ hai xem chỉ số huyết áp" |

Thêm một lý do mang tính pháp lý ở mục 4: bằng chứng đồng thuận và quyền của chủ thể dữ liệu **phải** ghi ở phía máy chủ mới có giá trị.

---

## 1. Kiến trúc đề xuất

```
┌──────────────┐   ┌──────────────┐
│  Web con cái │   │ App ba mẹ    │
│  (React)     │   │ (PWA)        │
└──────┬───────┘   └──────┬───────┘
       │  ĐỌC: trực tiếp  │  (realtime, rules bảo vệ)
       ├──────────────────┼──────────────► ┌─────────────┐
       │                  │                │  Firestore  │
       │  GHI: qua API    │                └──────▲──────┘
       ▼                  ▼                       │
┌──────────────────────────────────┐              │
│   API Backend — Cloud Run        │──────────────┘
│   (Node + Fastify, TypeScript)   │
│                                  │
│   · xác thực Firebase ID token   │
│   · kiểm quyền + đồng thuận      │
│   · ghi audit log                │
│   · proxy Gemini / Places        │
│   · giữ refresh token (mã hoá)   │
│   · xuất / xoá dữ liệu           │
└───────┬─────────────┬────────────┘
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────────┐
│ Secret Mgr   │  │ Cloud Scheduler  │
│ (khoá, KMS)  │  │ → nhắc thuốc     │
└──────────────┘  └──────────────────┘
```

### Quy tắc quan trọng nhất: đọc và ghi đi hai đường khác nhau

- **ĐỌC**: client gọi thẳng Firestore. Giữ được đồng bộ tức thời (ba mẹ bấm "đã uống" → web con cái hiện ngay). Bảo vệ bằng Security Rules.
- **GHI**: **mọi thao tác ghi có ý nghĩa đều qua API**. Firestore Rules đặt `allow write: if false` cho gần như toàn bộ.

Vì sao tách: ghi là chỗ cần kiểm quyền phức tạp, cần validate dữ liệu y tế, và cần để lại dấu vết. Rules không làm nổi ba việc đó. Còn đọc thì realtime quá giá trị để bỏ.

### Chọn công nghệ

| Thành phần | Chọn | Lý do |
|---|---|---|
| Runtime | **Cloud Run** | Chạy container thường, dev ở máy dễ, không khoá chặt vào một nhà cung cấp, có bậc miễn phí. Hơn Cloud Functions ở chỗ code là Express/Fastify bình thường |
| Ngôn ngữ | **TypeScript** | Dữ liệu y tế cần kiểu chặt. Dùng `zod` validate mọi đầu vào |
| CSDL | **Firestore** | Đã có, realtime, rules là lớp phòng thủ thứ hai |
| Khoá | **Secret Manager** | Không bao giờ để khoá trong biến môi trường của image |
| Mã hoá trường | **Cloud KMS** | Xem mục 3 |
| Hẹn giờ | **Cloud Scheduler + Tasks** | Nhắc thuốc, kiểm thuốc sắp hết |
| Vùng | **asia-southeast1** | Gần VN nhất. Xem cảnh báo chuyển dữ liệu ra nước ngoài ở mục 4 |

> Cloud Run và Cloud Scheduler đòi **gói Blaze** của Firebase. Đây là chi phí bắt buộc của việc làm sản phẩm thật.

---

## 2. Mô hình mối đe doạ

Liệt kê thẳng ai có thể làm hỏng chuyện gì. Không có mục này thì "bảo mật" chỉ là khẩu hiệu.

| # | Mối đe doạ | Hậu quả | Phòng bằng gì |
|---|---|---|---|
| T1 | Firestore Rules lỏng → đọc chéo gia đình | Rò toàn bộ hồ sơ y tế | Deny-by-default; **test tự động** bằng emulator, không phải bấm tay ([23](23-Security-Privacy.md) mục 2) |
| T2 | Người trong nhà xem lén (anh chị em, dâu rể) | Vi phạm riêng tư trong chính gia đình | Quyền theo từng thành viên + **màn "ai đang xem thông tin của tôi"** + ba mẹ rút quyền được |
| T3 | Khoá API lộ trong bundle | Hoá đơn của người khác tiêu | Backend proxy — mục 1 |
| T4 | Ảnh đơn thuốc bị lấy qua URL đoán được | Rò dữ liệu nặng nhất | Signed URL ngắn hạn, không bao giờ public bucket |
| T5 | Prompt injection qua ảnh đơn thuốc | AI đọc chữ trong ảnh rồi làm theo | Coi output của Gemini là **dữ liệu**, không phải lệnh. Đã có: người xác nhận trước khi lưu ([33](33-Medical-Safety-Audit.md) mục 9) |
| T6 | Tài khoản bị chiếm | Kẻ khác thấy hồ sơ y tế | Bắt xác thực lại khi đổi quyền; thông báo khi có thiết bị mới |
| T7 | Nhân viên/dev đọc dữ liệu người dùng | Rò từ bên trong | Mã hoá trường nhạy cảm; audit log truy cập cả của admin; nguyên tắc quyền tối thiểu |
| T8 | Mất dữ liệu | Người dùng mất lịch sử thuốc | Sao lưu Firestore theo lịch + thử phục hồi định kỳ |
| T9 | Rời bỏ / xoá tài khoản không sạch | Vi phạm quyền chủ thể dữ liệu | Luồng xoá thật, mục 5 |
| T10 | Backend bị lạm dụng làm proxy Gemini miễn phí | Cháy hạn mức | Rate limit theo `uid`, hạn mức ngày, chặn khi vượt |

---

## 3. Mã hoá & xử lý dữ liệu nhạy cảm

### Ba tầng

1. **Khi truyền** — HTTPS mọi nơi, HSTS. Cloud Run có sẵn.
2. **Khi lưu** — Google mã hoá mặc định ở tầng hạ tầng. Chưa đủ, vì admin project vẫn đọc được.
3. **Mã hoá tầng ứng dụng** cho nhóm 🔴 — đây là tầng phải tự làm.

### Trường nào cần mã hoá tầng ứng dụng

| Trường | Mã hoá? | Vì sao |
|---|---|---|
| Ảnh đơn thuốc | **Có** | Chứa họ tên, tuổi, chẩn đoán, bác sĩ |
| `diagnosis_text` | **Có** | Chẩn đoán là dữ liệu nhạy cảm nhất |
| Dị ứng, bệnh nền | **Có** | |
| Ghi chú triệu chứng | **Có** | |
| Chỉ số huyết áp/đường huyết | **Có** | |
| Tên thuốc, liều, giờ uống | Không | Cần truy vấn và tính toán. Bảo vệ bằng quyền truy cập |
| Tên gọi thân mật, avatar | Không | |

Cách làm: **envelope encryption** — Cloud KMS giữ khoá gốc, mỗi gia đình một khoá dữ liệu riêng, khoá dữ liệu được KMS mã hoá rồi lưu cạnh dữ liệu. Backend giải mã khi phục vụ request hợp lệ.

> Đánh đổi phải chấp nhận: trường đã mã hoá thì **không truy vấn theo nội dung được**. Vì vậy đừng mã hoá tên thuốc — mọi kiểm tra an toàn ở [33](33-Medical-Safety-Audit.md) đều dựa vào nó.

### Ảnh đơn thuốc — nên đừng giữ

Mặc định nên là: **trích xuất xong thì xoá ảnh**. Giữ ảnh mang lại rất ít giá trị so với rủi ro. Nếu người dùng muốn giữ (để đối chiếu sau), phải là lựa chọn có ý thức, và xoá được bất cứ lúc nào.

---

## 4. ⚖️ Tuân thủ pháp luật Việt Nam

> Phần này liệt kê các **ràng buộc thiết kế** phát sinh từ quy định về dữ liệu cá nhân. Coi đây là yêu cầu kỹ thuật, không phải cảnh báo pháp lý — làm đúng mấy điều dưới đây thì phần lớn nghĩa vụ được đáp ứng bằng chính kiến trúc.

### Nghị định 13/2023/NĐ-CP — bảo vệ dữ liệu cá nhân

Dữ liệu sức khỏe được xếp là **dữ liệu cá nhân nhạy cảm**. Kéo theo nghĩa vụ nặng hơn dữ liệu thường:

| Nghĩa vụ | Ảnh hưởng tới thiết kế |
|---|---|
| **Đồng thuận rõ ràng, tách bạch theo mục đích** | Không được gộp một ô "Tôi đồng ý điều khoản". Phải tách: đồng ý xử lý dữ liệu sức khỏe · đồng ý gửi ảnh cho AI · đồng ý chia sẻ với thành viên nào · đồng ý analytics |
| **Phải chứng minh được đã có đồng thuận** | Lưu bản ghi đồng thuận: ai, lúc nào, phiên bản văn bản nào, qua thiết bị nào. **Bất biến, chỉ thêm không sửa** |
| **Quyền của chủ thể dữ liệu** | Xem · sửa · xoá · rút đồng thuận · yêu cầu hạn chế xử lý. Mỗi quyền phải có nút bấm thật trong app |
| **Hồ sơ đánh giá tác động (DPIA)** | Phải lập và gửi cơ quan chức năng trong thời hạn quy định sau khi bắt đầu xử lý |
| **Thông báo khi có sự cố rò rỉ** | Cần quy trình sẵn, không phải nghĩ lúc xảy ra |

### 🚨 Chuyển dữ liệu ra nước ngoài — điểm đáng lo nhất

Gọi Gemini API và lưu Firestore ở Singapore đều là **chuyển dữ liệu cá nhân nhạy cảm ra nước ngoài**. Nghị định 13 yêu cầu **hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài** riêng.

Cách giảm rủi ro về mặt kiến trúc, nên làm bất kể kết luận pháp lý ra sao:

1. **Tách định danh trước khi gửi cho AI.** Nơi nào tách được thì tách — ví dụ phần giải thích thuốc chỉ gửi **tên hoạt chất**, không gửi thông tin bệnh nhân (điều này [25](25-AI-Prompts.md) mục 2 đã yêu cầu và code đang làm đúng).
2. **Ảnh đơn thuốc thì không tách được** — phải xin **đồng thuận riêng, nói thẳng**: *"ảnh đơn sẽ được gửi tới máy chủ Google ở nước ngoài để đọc chữ"*.
3. **Dùng bậc trả phí của Gemini** để dữ liệu không vào quá trình huấn luyện ([36](36-Google-Integration.md) mục 9).
4. **Không lưu ảnh sau khi trích xuất** — giảm thời gian dữ liệu tồn tại ở nước ngoài.
5. Ghi mọi lần chuyển vào audit log.

### Giữ sản phẩm nằm đúng chỗ

Bộ phân loại triệu chứng ở [33](33-Medical-Safety-Audit.md) đưa ra khuyến nghị hành động (gọi 115 / đi khám trong 24h). Ba việc dưới đây giữ cho sản phẩm nằm đúng vạch "công cụ thông tin", và cũng chính là thứ làm nó đáng tin:
- Giữ nguyên định vị sản phẩm là **"sắp xếp và hiểu thông tin thuốc"** ([27](27-Risk-Register.md) E1) — không dùng từ chẩn đoán, không dùng từ điều trị
- **Bảng luật tĩnh do người có chuyên môn duyệt** ([35](35-Safety-Fixes-Log.md) mục 4.1) — đây vừa là an toàn, vừa là hồ sơ chứng minh khi cần
- Ghi phiên bản bảng luật vào từng quyết định (code đã làm: `rules_version` trong kết quả triage)

---

## 5. Quyền của chủ thể dữ liệu — phải có nút bấm thật

Không phải mục "nice to have". Đây là thứ tạo ra **niềm tin** mà Thanh nói tới, và cũng là nghĩa vụ pháp lý.

| Quyền | Trong app phải có | Backend làm gì |
|---|---|---|
| Xem dữ liệu của tôi | "Tải toàn bộ dữ liệu của tôi" | Xuất JSON + ảnh, gửi qua link ký ngắn hạn |
| Sửa | Sửa được hồ sơ, dị ứng, thuốc | Ghi audit ai sửa gì |
| **Xoá** | "Xoá tài khoản và toàn bộ dữ liệu" | Xoá thật: Firestore, Storage, sự kiện Calendar do app tạo, token. Có thời gian ân hạn để đổi ý |
| Rút đồng thuận | Từng mục riêng, tắt được từng cái | Ngưng xử lý tương ứng ngay |
| **Ai đang xem dữ liệu của tôi** | Danh sách người có quyền + lịch sử truy cập + nút thu hồi | Đọc từ audit log |

Mục cuối đặc biệt quan trọng khi ba mẹ tự chủ ([37](37-Product-Architecture.md) mục 4): ba mẹ phải là người **kiểm soát** dữ liệu của chính mình, không phải đối tượng bị theo dõi. [23](23-Security-Privacy.md) mục 6 đã nêu, chưa làm.

---

## 6. ⚠️ Sửa lại một quy tắc cũ đang mâu thuẫn

[23](23-Security-Privacy.md) mục 2 hiện ghi:

> *"Ba mẹ (role được-chăm-sóc) **không sửa được** hồ sơ, chỉ xác nhận liều của chính mình."*

Quy tắc này **chặn thẳng** yêu cầu tự chủ ở [37](37-Product-Architecture.md) mục 4. Nó xuất phát từ giả định "con cái setup hộ 100%" — giả định đã bị bác bỏ.

**Quy tắc thay thế (chốt 12/08):**

> **Tài khoản host là của một người con** — người lập nhà, mời người khác vào, và là người duy nhất quản lý quyền truy cập.
> **Ba mẹ có vai `subject`**: đọc mọi thứ trong nhà, và **tự thêm/sửa dữ liệu của chính mình** (thuốc, chỉ số, triệu chứng). Không làm việc quản trị.

Thay đổi so với [23](23-Security-Privacy.md) bản cũ chỉ nằm ở một chỗ: ba mẹ **có** quyền sửa dữ liệu của mình — đủ để tự chủ khi con ở xa, mà không phải gánh việc quản lý danh sách ai được xem gì.

Chi tiết bảng vai ở [39](39-Data-Model-Input-Flows.md) mục 2.

> Vẫn nên có màn **"ai đang trong nhà"** cho ba mẹ xem — chỉ để minh bạch, không kèm nút thu hồi. Biết ai đang thấy dữ liệu của mình là chuyện khác với việc phải đi quản lý nó.

---

## 7. Bề mặt API backend (bản phác)

```
POST   /v1/auth/session              đổi Firebase ID token → phiên
POST   /v1/auth/google/connect       luồng OAuth phía server, giữ refresh token
DELETE /v1/auth/google               ngắt kết nối, thu hồi token

POST   /v1/families                  tạo gia đình
POST   /v1/families/:id/invites      tạo lời mời (hai chiều)
POST   /v1/invites/:code/accept      nhận lời mời
DELETE /v1/families/:id/access/:uid  thu hồi quyền

POST   /v1/members/:id/prescriptions thêm đơn (đã qua người xác nhận)
PATCH  /v1/prescriptions/:id         sửa
POST   /v1/members/:id/doses         ghi đã uống
POST   /v1/members/:id/vitals        ghi chỉ số
POST   /v1/members/:id/symptoms      ghi triệu chứng + kết quả phân loại

POST   /v1/ai/extract-prescription   proxy Gemini Vision  (rate limit)
POST   /v1/ai/ask                    proxy Gemini text    (rate limit)
POST   /v1/places/nearby             proxy Places API     (có cache)

POST   /v1/consents                  ghi đồng thuận
DELETE /v1/consents/:id              rút đồng thuận
GET    /v1/me/export                 xuất toàn bộ dữ liệu
DELETE /v1/me                        xoá tài khoản
GET    /v1/me/access-log             ai đã xem dữ liệu của tôi
```

**Áp cho mọi endpoint:**
- Xác thực Firebase ID token, không tin bất cứ thứ gì client gửi lên
- `zod` validate toàn bộ đầu vào
- Kiểm quyền **và** kiểm đồng thuận còn hiệu lực
- Ghi audit trước khi trả kết quả
- Rate limit theo `uid` và theo IP
- Trả lỗi theo đúng nguyên tắc đã áp ở [35](35-Safety-Fixes-Log.md) mục 5: **thất bại thì báo thất bại, không bao giờ trả dữ liệu giả**

---

## 8. Việc phải làm, theo thứ tự

### Giai đoạn A — dựng khung backend
- [ ] Cloud Run + Fastify + TypeScript, deploy được bản "hello"
- [ ] Middleware xác thực Firebase ID token
- [ ] Đưa khoá vào Secret Manager, **xoá `VITE_GEMINI_API_KEY` khỏi client**
- [ ] Chuyển `geminiService.js` sang gọi `/v1/ai/*`
- [ ] Rate limit + hạn mức ngày theo người dùng

### Giai đoạn B — siết dữ liệu
- [ ] Firestore Rules: chuyển ghi sang `false`, chỉ backend ghi
- [ ] **Test rules tự động** bằng emulator, chạy trong CI
- [ ] Mã hoá tầng ứng dụng cho nhóm 🔴 (KMS)
- [ ] Storage: signed URL ngắn hạn, mặc định xoá ảnh sau khi trích xuất

### Giai đoạn C — đồng thuận & quyền
- [ ] Bản ghi đồng thuận, tách theo mục đích
- [ ] Audit log chỉ thêm không sửa
- [ ] Xuất dữ liệu · xoá tài khoản · màn "ai đang xem thông tin của tôi"

### Giai đoạn D — nhắc chạy nền
- [ ] OAuth phía server, refresh token mã hoá
- [ ] Cloud Scheduler → gửi nhắc
- [ ] Rơi về Google Calendar khi người dùng không bật thông báo

### Giai đoạn E — vận hành
- [ ] Sao lưu Firestore theo lịch + **thử phục hồi thật một lần**
- [ ] Cảnh báo lỗi, theo dõi chi phí
- [ ] Quy trình xử lý sự cố rò rỉ

> Giai đoạn A và B là **điều kiện cần** trước khi mời gia đình ngoài dùng. C là điều kiện cần trước khi có người dùng thật ở quy mô. D là thứ làm app thật sự hữu ích. E là thứ giữ cho nó đáng tin lâu dài.

---

## 9. Điều nên nói thẳng

Backend + tuân thủ + mã hoá + audit là **khối lượng công việc lớn hơn nhiều** so với phần app đã làm tới giờ. Với một người làm, đây là công việc tính bằng tháng, không phải bằng tuần.

Điều đó không có nghĩa là đừng làm. Nó có nghĩa là **thứ tự quan trọng**:

- Thi 30/08 → dùng đúng kiến trúc hiện tại, ghi rõ backend là roadmap
- Cho gia đình mình và vài gia đình quen dùng → cần xong Giai đoạn A + B
- Mở cho người lạ dùng → cần xong C, và cần luật sư đã xem qua

Cái tệ nhất là **mở cho người lạ dùng khi mới xong A**. Lúc đó app đã cầm dữ liệu y tế thật của người thật mà chưa có cơ chế đồng thuận, chưa có đường xoá dữ liệu, chưa có ai chịu trách nhiệm khi rò rỉ.

---

## 10. ⭐ Bí danh hoá hồ sơ trước khi gửi AI

> *"AI có thể đọc thành phần thuốc, tuy nhiên để phân tích đánh giá sức khoẻ hay toa thuốc cho một profile người thì cũng cần hiểu hết toàn bộ profile đó, vậy nên cần chuẩn bị cái ẩn danh ở phía sau gửi cho AI xử lý profile, ví dụ như có mã người dùng"* — Thanh, 12/08

Đúng hướng, và đây là cách làm cụ thể.

### Vấn đề

Hai yêu cầu kéo ngược nhau:
- Muốn lời khuyên **cá nhân hoá** → AI phải biết tuổi, bệnh nền, dị ứng, toàn bộ thuốc đang uống
- Muốn **bảo vệ danh tính** → AI không cần biết người đó tên gì, ở đâu, khám ở bệnh viện nào

May mắn là hai thứ này **tách được**. Thông tin cần cho suy luận lâm sàng và thông tin định danh gần như không giao nhau.

### Giải pháp: hồ sơ bí danh

Backend dựng một bản hồ sơ riêng để gửi AI:

```json
{
  "subject_ref": "sbj_7f3a9c2e",
  "age_band": "65-69",
  "sex": "F",
  "conditions": ["tăng huyết áp", "rối loạn lipid máu"],
  "allergies": ["penicillin"],
  "medications": [
    { "generic": "amlodipine", "strength": "5mg", "timing": "trưa, sau ăn",
      "days_remaining": 18, "special_missed_dose": false }
  ],
  "recent_vitals": [{ "type": "BP", "sys": 142, "dia": 88, "days_ago": 1 }],
  "recent_symptoms": [{ "region": "epigastric", "days_ago": 3 }]
}
```

**Giữ lại** (cần cho lâm sàng): dải tuổi · giới tính · bệnh nền · dị ứng · thuốc · liều · giờ · chỉ số · triệu chứng đã ghi

**Cắt bỏ** (không cần cho lâm sàng): họ tên · ngày sinh chính xác · số điện thoại · email · địa chỉ · **tên bác sĩ** · **tên bệnh viện** · số bảo hiểm y tế · mã bệnh nhân · ảnh đại diện

Dải tuổi thay ngày sinh: chênh lệch 2 tuổi không đổi lời khuyên, nhưng ngày sinh chính xác là mảnh ghép định danh mạnh.

### Bí danh theo từng mục đích

`subject_ref` là **mã ngẫu nhiên**, không suy ngược ra người được. Bảng ánh xạ chỉ nằm ở backend.

Quan trọng: **mỗi mục đích một bí danh khác nhau**.

```
Người thật  ──┬──► sbj_7f3a9c...   dùng khi gọi AI
              ├──► anl_2b81ff...   dùng cho analytics
              └──► sup_9c04ad...   dùng khi hỗ trợ kỹ thuật
```

Lý do: nếu dùng chung một mã, ai gom được hai tập dữ liệu là ghép lại ra chân dung đầy đủ. Mã khác nhau thì không ghép được.

> Nói cho đúng tên gọi: đây là **bí danh hoá**, không phải ẩn danh hoàn toàn — vì backend vẫn ánh xạ ngược được. Nhưng nó cắt được rủi ro lớn nhất: dữ liệu rời khỏi hệ thống không còn gắn với một con người cụ thể.

### Xử lý ảnh đơn thuốc — chỗ duy nhất không bí danh hoá được

Ảnh đơn có **họ tên bệnh nhân in trên giấy**. Không cắt được bằng phần mềm một cách đáng tin.

Cách xử lý: **tách quy trình làm hai chặng**.

```
CHẶNG 1 — ĐỌC CHỮ (chỉ chặng này có dữ liệu định danh)
  ảnh → Gemini Vision → văn bản
  · bậc trả phí (dữ liệu không vào huấn luyện)
  · xoá ảnh ngay sau khi trích xuất
  · đồng thuận riêng, nói thẳng "ảnh sẽ được gửi tới máy chủ Google"
  · ghi vào audit log
  → backend CẮT NGAY tên bệnh nhân, tên bác sĩ, tên bệnh viện khỏi kết quả

CHẶNG 2 — SUY LUẬN (dùng hồ sơ bí danh, không có định danh)
  giải thích thuốc · kiểm tra tương tác · trợ lý Cháu Bi · phân loại triệu chứng
  → đây là nơi CHIẾM PHẦN LỚN lượt gọi AI
```

Nghĩa là: dữ liệu định danh chỉ đi qua đúng **một lượt gọi**, còn lại toàn bộ chạy trên hồ sơ bí danh.

### Xưng hô vẫn ấm mà không lộ tên

Trợ lý gọi "bác Mười" nghe thân mật, nhưng tên không cần rời khỏi máy:

```
Backend → AI:    hồ sơ bí danh + "xưng hô người nghe là {{XUNG_HO}}"
AI → Backend:    "Dạ {{XUNG_HO}} ơi, viên trắng bác uống sau bữa trưa nha ạ."
Backend → Client: giữ nguyên chuỗi {{XUNG_HO}}
Client hiển thị:  thay {{XUNG_HO}} bằng tên thật, ngay trên máy
```

Người dùng thấy đúng tên mình. Tên chưa từng rời khỏi thiết bị trong luồng này.

### Việc phải làm
- [ ] `buildPseudonymousProfile(subjectId)` ở backend — mọi lời gọi AI đi qua hàm này
- [ ] Bảng ánh xạ bí danh, tách theo mục đích, mã hoá
- [ ] Bộ lọc cắt định danh khỏi kết quả trích xuất trước khi lưu
- [ ] Thay tên phía client bằng `{{XUNG_HO}}`
- [ ] Test: dựng hồ sơ bí danh rồi kiểm **không còn trường định danh nào** — chạy tự động trong CI

> Sửa `geminiService.js` hiện tại: `buildMemberContext()` đang nhét thẳng `display_name` vào prompt. Cần chuyển sang bí danh khi dời logic lên backend.

---

## 11. Thanh cần bật gì cho backend

Ngắn thôi — phần lớn là bấm nút trong Cloud Console.

| # | Việc | Ở đâu | Ghi chú |
|---|---|---|---|
| 1 | **Nâng lên gói Blaze** | Firebase Console → Upgrade | Bắt buộc để chạy Cloud Run/Scheduler. Vẫn có bậc miễn phí, chỉ là phải gắn thẻ |
| 2 | Bật **Cloud Run API** | Cloud Console → APIs | |
| 3 | Bật **Artifact Registry API** | | Nơi chứa container image |
| 4 | Bật **Secret Manager API** | | Chứa khoá thay cho `.env` |
| 5 | Bật **Cloud KMS API** | | Mã hoá trường nhạy cảm |
| 6 | Bật **Cloud Scheduler API** | | Nhắc uống thuốc chạy nền |
| 7 | Tạo **service account** cho backend | IAM → Service Accounts | Đặt tên `api-runtime` |
| 8 | Cấp quyền tối thiểu cho service account | IAM | `Firebase Admin SDK Administrator Service Agent`, `Secret Manager Secret Accessor`, `Cloud KMS CryptoKey Encrypter/Decrypter` — **không** cấp Owner |
| 9 | Đặt ngân sách | Billing → Budgets | Đã làm ở [40](40-Setup-Keys-Guide.md) bước 7 |

### 🔐 Một quyết định bảo mật ngay từ đầu

**Không tải file JSON service account về máy.** Cloud Run gắn service account trực tiếp vào container — code dùng Application Default Credentials, không cần file khoá nào.

File JSON service account là thứ hay bị commit nhầm lên GitHub nhất, và nó có quyền bỏ qua toàn bộ Firestore Rules. Không tạo ra nó thì không làm lộ được.

```js
// Đúng — không có khoá nào
import { initializeApp, applicationDefault } from 'firebase-admin/app';
initializeApp({ credential: applicationDefault() });
```

### Sau khi backend chạy

- [ ] Chuyển `VITE_GEMINI_API_KEY` và `VITE_GOOGLE_MAPS_API_KEY` vào Secret Manager
- [ ] **Xoá hai biến đó khỏi `.env` của client** — đây là bước làm cho việc dựng backend thực sự có tác dụng
- [ ] Thu hồi và tạo lại hai khoá đó (chúng đã từng nằm trong bundle nên coi như đã lộ)
