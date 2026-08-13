# 39 — Mô hình dữ liệu & luồng input nhiều chiều

> *"luồng input thì t muốn đảm bảo là nhiều chiều và dù có phức tạp như thế nào thì t vẫn muốn tìm cách để làm vì app này là vì user"* — Thanh, 12/08
>
> Doc này là chỗ độ phức tạp đó được chứa lại. Đọc kèm [38](38-Backend-Security.md) (bảo mật) và [37](37-Product-Architecture.md) (kiến trúc sản phẩm).

---

## 1. Mô hình hiện tại sai ở đâu

`mockData.js` hiện giả định: **một gia đình · một người quản lý · N người được chăm sóc**.

Thực tế trong gia đình Việt Nam phá vỡ giả định đó ngay lập tức:

| Tình huống thật | Mô hình hiện tại |
|---|---|
| Ba anh chị em cùng chăm một mẹ | ❌ chỉ một manager |
| Một người con chăm cả ba, mẹ, và bà nội | ⚠️ được, nhưng quyền không tách được theo từng người |
| Ông và bà cùng dùng app, nhắc thuốc cho nhau | ❌ không có vai "vừa được chăm vừa chăm người khác" |
| Ba mẹ dùng trước, mời con vào sau | ❌ mời chỉ đi một chiều |
| Con dâu, con rể cùng tham gia chăm sóc | ❌ quyền chỉ có manager / care_recipient |
| Dược sĩ xem danh sách thuốc trong 10 phút ở quầy | ❌ không có vai tạm thời |
| Mời một người ra khỏi nhà (ly hôn, mâu thuẫn) | ❌ không rút quyền được |

Điểm chung: cần **một người đứng tên quản lý** (host), người nhà vào theo lời mời, và quyền phải **rút được**.

---

## 2. Mô hình mới

### Nguyên tắc gốc (chốt 12/08)

> **Tài khoản host là của con cái.** Một người con đứng ra tạo tài khoản, mời ba mẹ và người nhà vào. Người đó quản lý ai được vào, ai bị mời ra.
>
> **Người dùng mục tiêu là một người con** — người chủ động chăm sóc. Mọi luồng chính đều thiết kế cho người này.
>
> **Trong nhà, mặc định là mở.** Ai đã được host mời vào đều xem được thông tin của các chủ thể. Con dâu, con rể, anh chị em — như nhau.
>
> **Ba mẹ tự sửa được dữ liệu của mình**, nhưng **không quản lý quyền truy cập**. Việc đó thuộc về host.

Vì sao đặt quyền ở host chứ không ở ba mẹ: người dựng và duy trì tài khoản là con cái, và bắt một người 70 tuổi đi quản lý danh sách ai được xem gì là đặt gánh nặng sai chỗ. Ba mẹ vẫn tự chủ ở phần quan trọng với họ — **thêm thuốc, ghi chỉ số, hỏi trợ lý** khi con ở xa.

So với [23](23-Security-Privacy.md) bản cũ (*"ba mẹ không sửa được hồ sơ"*), thay đổi duy nhất là ba mẹ **có** quyền sửa dữ liệu của chính mình.

### Cấu trúc

```
users/{uid}
  display_name, email, photo_url, locale
  created_at, last_seen_at

households/{householdId}            ← đơn vị quản lý, do MỘT người con lập
  host_uid                         ← người con đứng tên. Chỉ người này quản lý quyền
  name: "Nhà mình"
  created_at

care_subjects/{subjectId}          ← người được chăm sóc (ba, mẹ, ông, bà)
  household_id
  display_name, birth_year, capability (C1–C4)
  linked_uid           ← tài khoản của chính ba mẹ, nếu có. Có thể null
  conditions[], allergies[]        (mã hoá)
  created_at

households/{householdId}/grants/{uid}       ← QUYỀN, quản lý ở cấp nhà
  role: 'host' | 'family' | 'subject' | 'pharmacist'
  granted_by           ← luôn là host_uid
  granted_at
  expires_at           ← dược sĩ: 15 phút. người nhà: null
  revoked_at           ← chỉ host đặt được

care_subjects/{subjectId}/prescriptions/{id}
  medications[], doctor_name, facility, diagnosis_text (mã hoá)
  created_by_uid, source: 'ai_scan'|'manual'|'pharmacy'|'voice'
  confirmed_by_uid, confirmed_at        ← ai là người xác nhận, bắt buộc

care_subjects/{subjectId}/doses/{id}          log đã uống
care_subjects/{subjectId}/vitals/{id}         chỉ số (mã hoá)
care_subjects/{subjectId}/symptoms/{id}       triệu chứng + kết quả phân loại (mã hoá)

consents/{id}                       bằng chứng đồng thuận, chỉ thêm không sửa
audit_log/{id}                      ai chạm vào dữ liệu của ai, lúc nào
invites/{code}                      lời mời, chạy được cả hai chiều
```

**Hai thay đổi so với bản trước:**
1. Quyền quản lý ở cấp **`households`**, không phải từng `care_subject` — người nhà vào một lần là thấy cả ba lẫn mẹ, không phải mời từng người.
2. `host_uid` là **người con lập tài khoản**, không phải ba mẹ.

### Bảng vai và quyền

| Vai | Đọc mọi thứ trong nhà | Sửa hồ sơ & thuốc | Mời thêm người | Quản lý quyền |
|---|---|---|---|---|
| **host** (người con lập tài khoản) | ✅ | ✅ | ✅ | ✅ |
| **family** (anh chị em, dâu rể) | ✅ | ✅ | ✅ | ❌ |
| **subject** (ba mẹ) | ✅ | ✅ **của chính mình** | ❌ | ❌ |
| **pharmacist** (tạm, hết hạn 15 phút) | chỉ danh sách thuốc | ❌ | ❌ | ❌ |

**Mặc định khi được mời vào là `family`** — xem hết, sửa được, mời thêm được. Không phân quyền lắt nhắt lúc onboard; ai host đã mời vào là người nhà.

`subject` là vai của ba mẹ: đủ để **tự chủ trong việc chăm sóc bản thân** (thêm thuốc, ghi chỉ số, hỏi trợ lý, xác nhận đã uống) nhưng không phải đi làm việc quản trị.

Chỉ **host** có nút mời ra và đổi vai. Một nhà một host, chuyển được cho người khác nếu cần.

---

## 3. Luồng input — tất cả các đường dữ liệu đi vào

Đây là phần Thanh muốn "nhiều chiều". Liệt kê đầy đủ, kèm mức ưu tiên.

| # | Đường vào | Ai dùng | Ưu tiên | Ghi chú kỹ thuật |
|---|---|---|---|---|
| I1 | Con chụp đơn thuốc (web) | Con cái | ✅ đã có | |
| I2 | **Ba mẹ tự chụp đơn** | Ba mẹ | 🔴 P1 | Mở thẳng camera sau, nút to ([37](37-Product-Architecture.md) mục 4) |
| I3 | Nhập tay | Cả hai | ✅ đã có | Là phương án B bắt buộc ([27](27-Risk-Register.md) R1) |
| I4 | Chụp **túi thuốc nhà thuốc** | Cả hai | 🔴 P1 | Chữ in, dễ đọc hơn đơn viết tay nhiều |
| I5 | Chụp vỏ vỉ / hộp thuốc | Cả hai | 🟠 P2 | Cho thuốc mua lẻ không có đơn |
| I6 | **Giọng nói**: "bác mới được kê thêm thuốc" | Ba mẹ | 🟠 P2 | Trợ lý hỏi lại rồi mở camera ([31](31-Assistant-Conversations.md) mục 5) |
| I7 | Chụp màn hình máy đo huyết áp / đường huyết | Ba mẹ | 🟠 P2 | Đã gỡ bản giả ([33](33-Medical-Safety-Audit.md) mục 10), cần nối Gemini thật |
| I8 | Nhập tay chỉ số | Ba mẹ | ✅ đã có | |
| I9 | **Dược sĩ nhập hộ tại quầy** | Dược sĩ | 🟠 P2 | Vai `pharmacist` hết hạn sau 15 phút ([32](32-Pharmacy-Mode.md)) |
| I10 | Kết quả xét nghiệm (ảnh/PDF) | Cả hai | 🟡 P3 | Chỉ lưu và hiển thị, **không diễn giải** |
| I11 | **Chia sẻ ảnh từ app khác** (Zalo, Ảnh) | Cả hai | 🟡 P3 | Web Share Target — Android được, iOS chưa |
| I12 | Đọc lịch khám sẵn có từ Google Calendar | Con cái | 🟡 P3 | Chiều ngược lại của [36](36-Google-Integration.md) |
| I13 | Đồng bộ Health Connect / Google Fit | Ba mẹ | 🟡 P3 | Bước đo, nhịp tim từ đồng hồ |
| I14 | Đơn thuốc điện tử từ bệnh viện | — | ⬜ sau | Chưa có chuẩn dùng chung ở VN |

### Nguyên tắc chung cho mọi đường vào

Bất kể dữ liệu vào bằng đường nào, **tất cả đều đi qua cùng một cửa**:

```
Đường vào bất kỳ (I1–I14)
        ↓
   Chuẩn hoá về cùng một schema
        ↓
   NGƯỜI XÁC NHẬN  ← không đường nào được bỏ qua bước này
        ↓
   Kiểm tra an toàn (dị ứng, trùng hoạt chất, tương tác)
        ↓
   Lưu, kèm ai xác nhận và lúc nào
```

Lý do bắt buộc: [33](33-Medical-Safety-Audit.md) mục 4 và 9. Thêm đường vào mới **không được** đẻ thêm đường lách qua bước xác nhận. Đây là ràng buộc kiến trúc, không phải khuyến nghị.

---

## 4. Luồng ra — dữ liệu đi tới ai

| # | Đi đâu | Khi nào | Trạng thái |
|---|---|---|---|
| O1 | Nhắc trong app ba mẹ | Tới cữ | cần backend ([38](38-Backend-Security.md) giai đoạn D) |
| O2 | Google Calendar | Khi lưu đơn | ✅ code xong, chưa nối UI |
| O3 | Google Tasks — mua thêm thuốc | Sắp hết | ✅ code xong |
| O4 | Báo con cái: đã uống / bỏ liều | Realtime | cần Firestore (T4) |
| O5 | **Báo con cái: cảnh báo an toàn nghiêm trọng** | Ngay | 🔴 chưa làm — xem mục 6 |
| O6 | Báo con cái: cấp cứu | Ngay | 🔴 chưa làm ([36](36-Google-Integration.md) T5) |
| O7 | Màn cho dược sĩ xem | Khi bấm | ✅ đã có |
| O8 | Xuất dữ liệu cho bác sĩ (PDF) | Khi bấm | 🟡 P3 — mang đi khám rất hữu ích |
| O9 | Xuất toàn bộ dữ liệu cho chính chủ | Khi bấm | bắt buộc theo [38](38-Backend-Security.md) mục 5 |

---

## 5. Nhiều người cùng sửa — phải xử lý xung đột

Khi ba anh chị em cùng chăm một mẹ, chuyện này sẽ xảy ra:

| Tình huống | Cách xử |
|---|---|
| Hai người cùng thêm một đơn thuốc từ cùng một tờ giấy | Phát hiện trùng: cùng thành viên + tên thuốc trùng + ngày gần nhau → hỏi "có phải cùng một đơn không?" |
| Người A sửa liều trong lúc người B đang xem | Firestore realtime tự đẩy; hiện "vừa được {tên} cập nhật" |
| Ba mẹ bấm "đã uống" khi mất mạng, con đánh dấu "bỏ liều" | Ghi cả hai kèm mốc thời gian; **ưu tiên ghi nhận của chính ba mẹ** — họ là người biết mình có uống hay không |
| Ba mẹ sửa giờ uống, con sửa ngược lại | Không tự động phân xử. Báo cho cả hai, để họ nói chuyện với nhau |

Nguyên tắc: **app không phân xử thay người trong nhà.** Việc của app là làm cho bất đồng lộ ra sớm, không phải chọn phe.

### Offline

Ba mẹ ở quê sóng yếu là chuyện thường, không phải trường hợp hiếm.

- Ghi vào hàng đợi ở máy trước, đồng bộ sau
- Mỗi thao tác có `client_id` + mốc thời gian → chống ghi trùng khi thử lại
- UI nói rõ: *"đã lưu ở máy, sẽ gửi khi có mạng"* — **không hiện dấu tích như đã đồng bộ xong**
- Riêng "đã uống thuốc" phải chạy được hoàn toàn offline. Đây là hành động quan trọng nhất trong app

---

## 6. ⚠️ Ba mẹ tự chủ làm phần an toàn nặng thêm

Khi con cái không còn kiểm lại từng đơn ([37](37-Product-Architecture.md) mục 4), lớp bảo vệ mỏng đi. Bù lại bằng ba việc:

1. **Cảnh báo mức CRITICAL luôn báo cho người chăm sóc.** Ba mẹ tự thêm một thuốc trùng hoạt chất, hoặc trùng dị ứng đã ghi → con cái nhận thông báo **kể cả khi ba mẹ bấm bỏ qua**. Không phải để giám sát, mà vì đây đúng là lúc cần người thứ hai nhìn vào.
2. **Cảnh báo ở app ba mẹ phải viết dễ hơn nữa.** Người đọc chính là người sẽ uống viên thuốc đó, không phải người đi hỏi bác sĩ giùm.
3. **Thuốc chưa nhận dạng được thì nói thẳng là chưa kiểm được** — code đã làm đúng ([35](35-Safety-Fixes-Log.md)), giữ nguyên nguyên tắc này ở phía ba mẹ.

**Đã chốt (12/08):** ba mẹ **làm được mọi thứ**, nhưng thao tác có rủi ro cao sẽ **báo cho con cái**, chứ không bị chặn. Tôn trọng quyền tự quyết, đồng thời không để ai một mình với một cảnh báo nghiêm trọng.

Vì con cái là người setup chính và là người dùng mục tiêu, việc báo này phục vụ đúng mục đích của app: **con biết ba mẹ vừa có thuốc mới**, kể cả khi ở xa.

---

## 7. Lời mời hai chiều

Hiện chỉ có con → ba mẹ. Cần cả hai chiều, dùng chung một cơ chế:

```
LUỒNG CHÍNH — host mời                 LUỒNG PHỤ — ba mẹ dùng trước
  con lập nhà + tạo hồ sơ ba mẹ          ba mẹ tự tạo hồ sơ của mình
  tạo mã mời                             tạo mã mời gửi con
  gửi qua Zalo/SMS                       con mở /join/:code
  ba mẹ hoặc anh chị em mở /join/:code    con đăng nhập
  đăng nhập (hoặc mã PIN cho ba mẹ)      → con nhận vai host
  → nhận vai subject / family            → ba mẹ chuyển thành subject
```

**Luồng chính là con mời** — con cái là người chủ động, đây là luồng phải chạy mượt nhất.

Luồng phụ tồn tại để ba mẹ không bị kẹt khi chưa có con nào setup. Khi con vào, **quyền host chuyển sang con** — vì việc quản trị nên nằm ở người dùng app thường xuyên hơn.

Yêu cầu kỹ thuật cho mã mời:
- Ngẫu nhiên đủ mạnh, hết hạn sau 72 giờ, dùng một lần
- Nêu rõ mời ai, quyền gì, trước khi bấm chấp nhận
- Bị lộ mã cũng không đủ để vào — phải qua bước duyệt
- Rút lại được sau khi đã chấp nhận

---

## 8. Việc phải làm

### Chuyển đổi mô hình dữ liệu (làm trước, càng để lâu càng đắt)
- [ ] `families/*` → `households/*` + `care_subjects/*` + `grants/*`
- [ ] Sửa `firestore.rules` theo mô hình quyền mới
- [ ] Test rules tự động bằng emulator, chạy trong CI
- [ ] Viết script chuyển dữ liệu (hiện chưa có người dùng thật nên còn rẻ)

### Đường vào ưu tiên
- [ ] I2 ba mẹ tự chụp · I4 túi thuốc nhà thuốc
- [ ] I7 đọc máy đo bằng Gemini thật
- [ ] I6 giọng nói dẫn tới chụp ảnh
- [ ] I9 vai dược sĩ hết hạn theo giờ

### Nhiều người dùng chung
- [ ] Mời hai chiều + màn duyệt
- [ ] Màn quản lý thành viên cho host: ai đang trong nhà, mời ra, đổi vai
- [ ] Ba mẹ xem được **ai đang trong nhà** (minh bạch, không có nút thu hồi)
- [ ] Phát hiện đơn trùng
- [ ] Hàng đợi offline + chống ghi trùng

### An toàn cho chế độ tự chủ
- [ ] Cảnh báo CRITICAL tự động báo người chăm sóc
- [ ] Viết lại lời cảnh báo cho phía ba mẹ

---

## 9. Hồ sơ gửi cho AI — bí danh hoá

Chi tiết đầy đủ ở [38](38-Backend-Security.md) mục 10. Phần ở đây là ảnh hưởng tới mô hình dữ liệu.

Mỗi `care_subject` mang thêm các bí danh, **tách theo mục đích**:

```
care_subjects/{subjectId}
  ...
  pseudonyms:
    ai:        "sbj_7f3a9c2e"      gửi kèm mọi lời gọi AI
    analytics: "anl_2b81ff40"      gửi vào GA4
    support:   "sup_9c04ad13"      dùng khi hỗ trợ kỹ thuật
```

Ba mã khác nhau để không ai ghép hai tập dữ liệu lại thành chân dung đầy đủ.

### Ảnh hưởng tới truy vấn

Backend cần một hàm duy nhất dựng hồ sơ gửi AI:

```
buildPseudonymousProfile(subjectId) →
  { subject_ref, age_band, sex, conditions, allergies,
    medications[], recent_vitals[], recent_symptoms[] }
```

**Mọi** lời gọi AI phải đi qua hàm này. Không có đường tắt nào truyền thẳng document gốc vào prompt.

Kiểm bằng test tự động: dựng hồ sơ rồi khẳng định **không tồn tại** trường `display_name`, `birth_year`, `doctor_name`, `facility_name`, `phone`, `email`. Chạy trong CI, để sau này thêm trường mới mà quên là test đỏ ngay.

---

## 10. Theo dõi hành vi người dùng & lưu lượng

Thanh xác nhận cần. Chi tiết bộ sự kiện ở [36](36-Google-Integration.md) mục 11.

Điểm nối với mô hình dữ liệu: analytics dùng **bí danh `analytics`**, không dùng `uid` và không dùng `subject_ref` của AI.

```
GA4 nhận:   anl_2b81ff40  ·  sự kiện  ·  tham số đã bỏ định danh
GA4 KHÔNG nhận:  tên thuốc · triệu chứng · tên người · chỉ số sinh hiệu
```

Số liệu lấy được vẫn đủ để điều hành sản phẩm và để viết vào [26](26-User-Testing-Metrics.md):

| Câu hỏi | Đo bằng |
|---|---|
| Bao nhiêu gia đình đang dùng thật | người dùng hoạt động ngày/tháng |
| Ba mẹ có tự dùng không, hay chỉ con cái dùng | tỉ lệ sự kiện theo vai |
| Tỉ lệ tuân thủ uống thuốc | `dose_confirmed` / số liều theo lịch |
| Người dùng bỏ cuộc ở bước nào | phễu: đăng nhập → mời → quét đơn đầu tiên |
| Bộ phân loại triệu chứng chạy bao nhiêu lần, ra nhánh nào | `symptom_intake_completed` theo `outcome` |
| Quét đơn hỏng bao nhiêu phần trăm | `extraction_failed` theo `error_code` |

Hai dòng cuối vừa là chỉ số sản phẩm, vừa là **chỉ số an toàn** — số ca ra nhánh cấp cứu và tỉ lệ đọc hỏng đơn là thứ cần theo dõi liên tục, không phải đo một lần rồi thôi.
