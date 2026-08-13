# 36 — Kết nối Google API: đặc tả bàn giao

> Tài liệu để **Thanh tự lấy khoá** và **Antigravity làm nốt phần code**.
> Trạng thái ngày 12/08: đã dựng xong tầng kết nối, còn 4 màn hình chưa nối dây.

---

## 0. ⚠️ Đọc trước — một hiểu nhầm cần gỡ

> *"Antigravity là của Google cũng có access sẵn vào mấy cái app đó"*

**Không phải vậy.** Antigravity là công cụ viết code — nó không có, và không thể có, quyền vào tài khoản Google cá nhân của Thanh hay của ba mẹ. OAuth hoạt động như sau:

```
App của Thanh  ──xin quyền──▶  Người dùng bấm "Đồng ý" trong trình duyệt
      ▲                                      │
      └────────── access token ◀─────────────┘
```

Chuỗi này bắt buộc phải có:
1. **Một project Google Cloud của Thanh** — không dùng ké project của ai được
2. **OAuth consent screen** đã khai báo đúng scope
3. **Người dùng cuối tự bấm đồng ý** — kể cả Thanh cũng phải bấm cho tài khoản của chính mình

Antigravity làm được: viết code, chạy build, sửa lỗi.
Antigravity **không** làm được: tạo project Cloud hộ, bấm đồng ý hộ, sinh ra khoá hộ.

→ **Phần mục 2 và 3 dưới đây là việc của Thanh, không giao cho Antigravity được.**

---

## 1. Trạng thái hiện tại

### ✅ Đã xong (không cần làm lại)

| File | Nội dung |
|---|---|
| `src/services/googleAuth.js` | Đăng nhập Google + lấy access token, lưu ở sessionStorage, tự phát hiện token hết hạn, `googleApiFetch()` gom mọi lời gọi API về một chỗ, dịch mã lỗi sang tiếng Việt nói rõ phải làm gì |
| `src/services/googleCalendar.js` | Calendar API thật: tạo sự kiện lặp hằng ngày bằng RRULE, sự kiện tái khám, liệt kê/xoá sự kiện do app tạo, `testCalendarConnection()` |
| `src/services/googleTasks.js` | Tasks API thật: tạo việc mua thêm thuốc, liệt kê, đánh dấu xong |
| `src/services/googleMaps.js` | Places API (New): định vị thật + tìm quanh, tính khoảng cách haversine, xử lý đủ các lỗi hay gặp |
| `src/services/workspaceService.js` | Viết lại — **bỏ mock**, gọi API thật, trả kết quả **từng thuốc** (3 thuốc mà 2 lên lịch được thì phải nói rõ thuốc nào trượt) |
| `src/components/GoogleConnectPanel.jsx` | Màn kết nối, có nút "Kiểm tra" gọi API thật để xác nhận |
| `src/components/SyncStatusBadge.jsx` | Sửa — bỏ nhãn sai "Đồng bộ Firestore Live" |
| `src/components/PrescriptionUploadWizard.jsx` | Hiện kết quả đồng bộ thật ở màn cuối, kể cả khi trượt |
| `.env.example` | Danh sách biến môi trường |

Build xanh, `npm run test:safety` 33/33 đạt.

### 🔲 Còn lại — giao cho Antigravity (mục 5)

`GoogleConnectPanel` **chưa được gắn vào App.jsx**, nên hiện chưa có nút kết nối nào trên giao diện. Toàn bộ tầng dưới đã sẵn sàng, chỉ thiếu nối dây.

---

## 2. 🔑 Việc của Thanh — tạo project và bật API

### 2.1 Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → tạo project (hoặc dùng `ai-riser-namdosan-fa737` nếu đã có thật)
2. **Authentication → Sign-in method → bật Google**
3. **Authentication → Settings → Authorized domains** — thêm:
   - `localhost`
   - domain Firebase Hosting (`<project>.web.app`)
   - ⚠️ Thiếu bước này → lỗi `auth/unauthorized-domain` khi bấm kết nối
4. **Project settings → Your apps → Web app** → copy 6 giá trị vào `.env`
5. **Firestore Database → Create database** → chọn region `asia-southeast1` (Singapore, gần VN nhất)

> Lưu ý: `src/config/firebaseConfig.js` hiện có giá trị fallback bịa
> (`"AIzaSyDemoKeyForAIRiserNamDoSan2026"`). Điền `.env` xong thì **xoá luôn
> mấy giá trị fallback đó** để lỗi thiếu config lộ ra ngay thay vì âm thầm sai.

### 2.2 Bật API trong Google Cloud

Project Firebase **chính là** một project Google Cloud. Vào [console.cloud.google.com](https://console.cloud.google.com), chọn đúng project đó → **APIs & Services → Enable APIs**, bật:

| API | Dùng cho | Ghi chú |
|---|---|---|
| **Google Calendar API** | Lịch nhắc uống thuốc | Miễn phí |
| **Google Tasks API** | Việc mua thêm thuốc | Miễn phí |
| **Places API (New)** | Tìm nhà thuốc gần | ⚠️ **Bắt buộc bật thanh toán** |
| **Generative Language API** | Gemini (nếu không dùng khoá AI Studio) | |

> Không bật → API trả 403 `has not been used`. Code đã bắt lỗi này và hiện đúng câu hướng dẫn.

### 2.3 ⚠️ OAuth consent screen — chỗ dễ vỡ nhất

**APIs & Services → OAuth consent screen**

- User type: **External**
- Điền tên app, email hỗ trợ, email liên hệ
- **Scopes** — thêm hai cái:
  - `https://www.googleapis.com/auth/calendar.events`
  - `https://www.googleapis.com/auth/tasks`

**Đây là chỗ phải cẩn thận:** cả hai scope trên đều là **sensitive scope**. Hệ quả:

| Trạng thái app | Ai dùng được |
|---|---|
| **Testing** (mặc định) | Chỉ email nằm trong danh sách **Test users** — tối đa 100 người |
| **In production** | Ai cũng dùng được, **nhưng phải qua Google verification** (mất vài ngày đến vài tuần) |

→ Vào **Test users**, thêm email của Thanh và của ba mẹ.

> ⚠️ **Sửa lại khuyến nghị ban đầu.** Bản đầu của doc này bảo "thêm email ban giám khảo vào Test users". Cách đó **không dùng được**: không biết trước giám khảo dùng tài khoản nào, và họ sẽ không chịu báo email trước để được thêm vào danh sách.
>
> Cách đúng là **tách đăng nhập ra khỏi cấp quyền** — xem [37](37-Product-Architecture.md) mục 3. Tóm tắt: đăng nhập chỉ xin scope `email`/`profile` (**không phải sensitive**, không cần verification, không giới hạn 100 người, không có màn cảnh báo) → ai cũng đăng nhập và dùng được toàn bộ app. Riêng nút "Kết nối Lịch" mới xin scope sensitive, và là **tuỳ chọn**.

### 2.4 API keys

**APIs & Services → Credentials → Create credentials → API key**

Tạo **hai khoá riêng**, đừng dùng chung một khoá:

| Khoá | Giới hạn |
|---|---|
| Maps | Application restrictions: **HTTP referrers** → `localhost:*`, `<project>.web.app/*`. API restrictions: chỉ Places API (New) |
| Gemini | Lấy ở [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Đặt hạn mức chi tiêu ([24](24-Scale-Cost-Control.md)) |

### 2.5 Điền `.env`

```bash
cp .env.example .env
```

Rồi điền. **Không commit file `.env`** — đã có trong `.gitignore`.

---

## 3. Bảng biến môi trường

| Biến | Bắt buộc? | Thiếu thì sao |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Nên có | Scan đơn báo lỗi, chuyển sang nhập tay. App vẫn chạy |
| `VITE_FIREBASE_*` (6 biến) | **Có** | Không đăng nhập Google được → không có Calendar/Tasks |
| `VITE_GOOGLE_MAPS_API_KEY` | Nên có | Màn tìm nhà thuốc báo chưa cấu hình |

Nguyên tắc đã áp trong code: **thiếu khoá thì báo thiếu khoá, không bao giờ rơi về dữ liệu bịa.**

---

## 4. 🔲 Việc giao cho Antigravity

Chép nguyên phần này vào Antigravity.

### T1 — Gắn `GoogleConnectPanel` vào giao diện

`src/App.jsx` và `src/components/FamilyDashboard.jsx`

- Đặt `<GoogleConnectPanel />` ở đầu dashboard con gái (P1), phía trên `PrescriptionUploadWizard`
- Chỉ hiện ở view `dashboard` và `split` — app ba mẹ (P2) không cần
- Giữ trạng thái kết nối ở `App.jsx` để các màn khác dùng chung

### T2 — Nối `NearbyHealthcareModal` vào Maps thật

`src/components/NearbyHealthcareModal.jsx` — **đang là mock, chưa sửa**

- Xoá mảng `MOCK_HEALTHCARE_PLACES` (4 địa điểm TP.HCM ghi cứng)
- Gọi `findNearbyFromCurrentLocation()` từ `src/services/googleMaps.js` khi mở modal
- Ba trạng thái phải xử lý: đang tải · lỗi (hiện `error_message` + `hint`) · có kết quả
- Bộ lọc `PHARMACY / HOSPITAL / CLINIC` map sang `PLACE_TYPES` trong service
- **Bỏ nhãn "Google Maps Grounding"** — sai, đây là Places API chứ không phải grounding của Gemini
- Ghi rõ khoảng cách là **đường chim bay**, không phải quãng đường đi
- Bỏ bộ lọc "24/7": Places API mới không trả trường này trực tiếp. Dùng `is_open` (`currentOpeningHours.openNow`) thay thế, đổi nhãn thành "Đang mở cửa"
- ⚠️ Định vị cần HTTPS — trên `http://192.168.x.x` sẽ hỏng. Code đã có sẵn `hint` nói điều này, chỉ cần hiển thị

### T3 — Nối `AppointmentTrackerCard` vào Calendar thật

`src/components/AppointmentTrackerCard.jsx`

- Nút "Đồng bộ Google Calendar" hiện chỉ `setTimeout` rồi hiện "✓ Đã đồng bộ!" — **xoá cái giả này**
- Gọi `createAppointmentEvent()` từ `googleCalendar.js`
- Thành công → hiện link `html_link` để bấm sang xem sự kiện thật (đây là bằng chứng tốt nhất cho demo)
- Thất bại → hiện `error_message`, **không hiện dấu tích**

### T4 — Nối Firestore vào state của app

`src/services/firebaseService.js` đã viết sẵn nhưng **chưa file nào import**. App đang dùng `useState` thuần, reload là mất hết.

- `App.jsx`: thay `useState(INITIAL_PRESCRIPTIONS)` bằng `subscribeMemberPrescriptions()`
- `PrescriptionUploadWizard`: gọi `savePrescriptionToFirestore()` sau khi lưu
- `ParentHomeView`: gọi `logDoseConfirmation()` khi bấm "ĐÃ UỐNG RỒI"
- ⚠️ **Sửa luôn một lỗi trong file đó:** hiện khi Firestore lỗi nó `return {success: true, mock: true}` và rơi về `INITIAL_PRESCRIPTIONS`. Đây đúng kiểu "app nói dối" mà [33](33-Medical-Safety-Audit.md) đã liệt kê. Phải trả `{ok:false}` và cho UI hiện "chưa đồng bộ được"
- Test `firestore.rules` bằng Rules Playground **trước khi** mời người dùng thật ([23](23-Security-Privacy.md), rủi ro R6)

### T5 — Cảnh báo cấp cứu gửi thật cho người nhà

Liên quan lỗi **C2** trong [33](33-Medical-Safety-Audit.md): app từng nói *"con đã gửi tin báo động cho gia đình rồi ạ"* mà không gửi gì. Tôi đã bỏ câu đó và thay bằng nút người dùng tự bấm, nhưng nút hiện **chỉ đổi trạng thái tại chỗ**.

- Ghi bản ghi cảnh báo vào Firestore `status_feed` khi bấm
- Dashboard con gái nghe `onSnapshot` → hiện ngay
- Chỉ khi ghi thành công mới đổi nút thành "✓ Đã gửi"
- Nếu sau này làm được push, xem lại giới hạn iOS ở [34](34-Testing-On-iPhone.md) mục 4

---

## 5. Nguyên tắc Antigravity **không được** làm ngược lại

Đây là những quyết định đã cân nhắc trong audit [33](33-Medical-Safety-Audit.md) và [35](35-Safety-Fixes-Log.md). Sửa ngược lại là làm hỏng an toàn:

1. **Thất bại thì báo thất bại.** Không `catch` rồi trả dữ liệu mẫu. Không `{success: true, mock: true}`.
2. **Nhãn chỉ được xanh khi có bằng chứng.** "Đã đồng bộ" chỉ hiện sau khi API trả 200 thật.
3. **Access token để sessionStorage, không phải localStorage.** Đây là app y tế, máy tính trong nhà thường dùng chung.
4. **Tiêu đề sự kiện Calendar mặc định KHÔNG ghi tên thuốc.** Lịch nằm trong tài khoản con cái, nhưng dữ liệu là bệnh của ba mẹ — dữ liệu sức khỏe của người thứ ba ([23](23-Security-Privacy.md) mục 4). Muốn ghi thì bật cờ `includeMedName`.
5. **Không xin thêm scope ngoài `calendar.events` và `tasks`.** Xin rộng hơn (vd `calendar` full, hay Gmail) vừa làm người dùng ngại bấm đồng ý, vừa kéo app vào diện verification nặng hơn.
6. **Đồng bộ Google là việc phụ.** Google lỗi không được làm mất đơn thuốc đã nhập.

---

## 6. Kiểm chứng — làm xong thì test thế nào

Không tin vào nhãn trên màn hình, mở **DevTools → Network** mà xem:

- [ ] Bấm "Kết nối Google" → hiện màn chọn tài khoản + màn xin quyền liệt kê đúng 2 quyền
- [ ] Bấm "Kiểm tra" ở Calendar → có request tới `googleapis.com/calendar/v3/...` trả 200
- [ ] Lưu một đơn thuốc → **mở Google Calendar thật** trên điện thoại, thấy sự kiện lặp đúng cữ
- [ ] Mở Google Tasks thật → thấy việc mua thêm thuốc
- [ ] Mở màn tìm nhà thuốc → có request tới `places.googleapis.com` và ra địa điểm **quanh chỗ đang ngồi**
- [ ] Ngắt kết nối rồi lưu đơn khác → app báo "chưa kết nối Google nên chưa tạo lịch", đơn **vẫn lưu được**
- [ ] Xoá `VITE_GOOGLE_MAPS_API_KEY` khỏi `.env`, build lại → màn nhà thuốc báo chưa cấu hình, **không hiện địa điểm nào**

Bài kiểm cuối, cũng là bài quan trọng nhất: **tắt mạng rồi bấm mọi nút**. Không nút nào được hiện dấu tích xanh.

---

## 7. Hạn chế đã biết, ghi lại để khỏi tưởng là bug

| Hạn chế | Chi tiết |
|---|---|
| **Token sống ~1 giờ** | Firebase không gia hạn access token của Google. Hết hạn → app mời kết nối lại. Muốn chạy nền dài hạn phải có backend giữ refresh token — ngoài phạm vi vòng thi |
| **Chế độ Testing giới hạn 100 tài khoản** | Do sensitive scope, xem mục 2.3 |
| **Places API tốn tiền** | Không có bậc miễn phí như Gemini. Đặt hạn mức ngân sách |
| **Tasks không đặt được giờ** | Trường `due` của Google Tasks chỉ nhận ngày, phần giờ bị bỏ qua. Giới hạn của chính API |
| **Khoá `VITE_*` lộ trong bundle** | Bản chất của app chạy hoàn toàn phía trình duyệt. Chỉ giảm rủi ro được bằng giới hạn referrer + hạn mức chi tiêu |
| **iOS web không push được** | Nên lời nhắc thật sự dựa vào Google Calendar, không phải app ([34](34-Testing-On-iPhone.md) mục 4) |

---

## 8. Thứ tự nên làm

1. **Thanh:** mục 2 — tạo project, bật API, thêm test users, lấy khoá, điền `.env`
2. **Antigravity:** T1 (gắn panel) → xác nhận kết nối chạy được **trước khi** làm tiếp
3. **Antigravity:** T3 (Calendar tái khám) — nhỏ, cho thấy kết quả thật ngay
4. **Antigravity:** T2 (Maps) — cần HTTPS để test, nhớ `npm run dev:https`
5. **Antigravity:** T4 (Firestore) — lớn nhất, đụng vào state toàn app
6. **Antigravity:** T5 (cảnh báo cấp cứu) — làm sau T4 vì phụ thuộc Firestore

Xong bước 2 là đã có thứ để quay demo: bấm nút trong app → mở Google Calendar trên điện thoại → sự kiện hiện ra thật.

---

## 9. 💰 Credit Google Cloud dùng vào đâu

### Cái gì tốn tiền, cái gì không

| Dịch vụ | Chi phí | Ghi chú |
|---|---|---|
| Firebase Auth | **Miễn phí** | Trừ đăng nhập bằng SMS (không dùng) |
| Firestore | **Miễn phí** ở gói Spark | Hạn mức ngày khá rộng so với quy mô demo. Vượt thì phải lên Blaze |
| Firebase Hosting | **Miễn phí** ở gói Spark | Đủ cho bài dự thi |
| Google Calendar API | **Miễn phí** | Chỉ giới hạn số lệnh gọi |
| Google Tasks API | **Miễn phí** | |
| Google Analytics / GA4 | **Miễn phí** | |
| **Places API (New)** | **Tốn tiền** | Có hạn mức miễn phí hàng tháng nhưng **bắt buộc bật tài khoản thanh toán**. Nearby Search nằm ở bậc giá cao hơn các lệnh cơ bản |
| **Gemini API** | Có bậc miễn phí | Nhưng xem phần dưới — bậc miễn phí có cái giá khác |

> Con số hạn mức miễn phí của Maps và Gemini thay đổi theo thời gian. **Đừng tin con số trong doc này** — mở trang pricing kiểm tra lúc setup, và quan trọng hơn là **đặt budget alert + quota cap** trong Cloud Console. Cap quota là thứ chặn thật; budget alert chỉ gửi mail sau khi tiền đã tiêu.

### ⚠️ Lý do quan trọng nhất để tiêu credit: dữ liệu bệnh nhân

Đây là điều đáng chú ý nhất trong cả mục này.

**Bậc miễn phí của Gemini API: Google được phép dùng nội dung gửi lên để cải thiện sản phẩm. Bậc trả phí: không.**

App này gửi lên Gemini **ảnh đơn thuốc thật của người thật** — có tên bệnh nhân, tên bác sĩ, chẩn đoán, bệnh viện. Ở bậc miễn phí, đó là dữ liệu sức khỏe của ba mẹ Thanh và của các gia đình thử nghiệm.

→ **Khuyến nghị: bật thanh toán (bậc trả phí) TRƯỚC khi mời gia đình thật dùng.** Đây chính là chỗ credit Google Cloud nên được tiêu. Chi phí thực tế cho vài chục gia đình rất nhỏ; cái mua được là dữ liệu bệnh nhân không đi vào quá trình huấn luyện.

Trong lúc còn tự test bằng đơn thuốc của chính mình thì bậc miễn phí không sao.

> Việc phải làm: ghi quyết định này vào [19](19-Decision-Log.md), bổ sung vào [23](23-Security-Privacy.md), và **nói ra trong bài nộp**. Đội nào nghĩ tới chuyện này thường là đội hiếm.

### Rủi ro cần thêm vào [27](27-Risk-Register.md)

| # | Rủi ro | Phương án |
|---|---|---|
| R17 | Bật billing làm mất Starter Tier của AI Studio (rủi ro R8 cũ) | Dùng **hai project tách biệt**: một cho demo/thi (free tier), một cho người dùng thật (trả phí) |
| R18 | Places API tiêu hết credit vì gọi lặp | Cache kết quả theo toạ độ làm tròn; chỉ gọi khi người dùng bấm, không gọi lúc mở màn |

---

## 10. 🔐 Bảng đầy đủ: cần tạo những khoá/token gì

Trả lời câu *"bình thường muốn liên kết app này kia đều cần OAuth hay token, app này không cần hả?"* — **có cần, đầy đủ.** Chỉ là chúng chia làm ba loại rất khác nhau, và hay bị gộp chung thành một chữ "secret".

### Loại 1 — Định danh công khai (KHÔNG phải secret)

Những thứ này **cố tình** lộ ra trong mã nguồn trình duyệt. Lộ không phải là lỗ hổng.

| Thứ | Tạo ở đâu | Bảo vệ bằng gì |
|---|---|---|
| Firebase web config (`apiKey`, `authDomain`, `projectId`...) | Firebase Console → Project settings | **Firestore Rules** + **Authorized domains**. `apiKey` của Firebase chỉ là mã định danh project, không phải mật khẩu |
| OAuth **Client ID** (Web application) | Cloud Console → Credentials | Danh sách **Authorized JavaScript origins** |
| GA4 Measurement ID | Firebase → Analytics | Không cần |

→ Bảo mật của nhóm này **không nằm ở việc giấu khoá**, mà ở Firestore Rules. Rules lỏng thì giấu khoá cỡ nào cũng vô nghĩa. Đây là rủi ro R6 trong [27](27-Risk-Register.md), và `firestore.rules` hiện **chưa được test bằng Rules Playground**.

### Loại 2 — Khoá tính tiền (phải giới hạn, dù vẫn lộ)

| Thứ | Tạo ở đâu | Bắt buộc phải làm |
|---|---|---|
| Gemini API key | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Giới hạn theo referrer + đặt quota cap |
| Maps API key | Cloud Console → Credentials | Giới hạn **HTTP referrer** + chỉ cho phép Places API + quota cap |

→ Lộ khoá nhóm này **không làm rò dữ liệu**, nhưng **làm rò tiền** — người khác nhúng khoá vào trang của họ và Thanh trả hoá đơn. Giới hạn referrer là thứ chặn việc đó.

→ Muốn giấu thật thì phải có **backend proxy** (Cloud Run / Cloud Functions) đứng giữa. Xem mục 12.

### Loại 3 — Secret thật (KHÔNG BAO GIỜ để phía trình duyệt)

| Thứ | Khi nào cần | Ghi chú |
|---|---|---|
| OAuth **Client Secret** | Chỉ khi có backend đổi authorization code lấy **refresh token** | App hiện dùng luồng client-side nên **chưa cần**. Cần khi muốn nhắc chạy nền dài hạn |
| Firebase **Admin SDK service account** (.json) | Chỉ khi có backend | Quyền bỏ qua toàn bộ Firestore Rules. Lộ là mất sạch dữ liệu |

### Tóm tắt cho tình trạng hiện tại

App **chạy hoàn toàn phía trình duyệt**, nên hiện chỉ cần **Loại 1 + Loại 2**. Không có secret thật nào để lộ. Đánh đổi là: khoá tính tiền phơi ra và chỉ được bảo vệ bằng referrer + quota.

Đây là đánh đổi hợp lý cho vòng thi, nhưng **phải nói rõ trong bài nộp** thay vì lờ đi — và nêu backend proxy là bước tiếp theo.

---

## 11. 📊 Analytics — theo dõi traffic và người dùng

Trả lời câu *"muốn setup tracking traffic hay user được không"* — được, và nó cũng phục vụ luôn [26](26-User-Testing-Metrics.md).

### Dùng gì

**Firebase Analytics (GA4)** — miễn phí, đã có sẵn trong `firebase` package, chỉ cần bật trong Console và thêm `measurementId` vào config.

```js
import { getAnalytics, logEvent } from 'firebase/analytics';
```

Cho luôn: số người dùng, DAU/MAU, giữ chân theo ngày, phễu, và luồng người dùng — đúng những con số [26](26-User-Testing-Metrics.md) cần.

### ⚠️ NHƯNG — đây là app y tế, không được tracking như app thường

Theo **Nghị định 13/2023/NĐ-CP**, dữ liệu sức khỏe là **dữ liệu cá nhân nhạy cảm**, cần sự đồng ý rõ ràng và riêng biệt. Gửi tên thuốc hay triệu chứng vào GA4 là đưa dữ liệu sức khỏe cho bên thứ ba.

**Tuyệt đối không log:** tên thuốc · nội dung triệu chứng · tên thành viên · tuổi · chẩn đoán · ảnh đơn · chỉ số huyết áp/đường huyết.

**Được log** (đã bỏ hết định danh, chỉ còn hành vi):

| Sự kiện | Tham số cho phép |
|---|---|
| `prescription_added` | `source: ai \| manual`, `med_count: number` |
| `dose_confirmed` | `time_slot` |
| `safety_warning_shown` | `type`, `severity` — **không kèm tên thuốc** |
| `symptom_intake_completed` | `outcome: emergency \| doctor_24h \| log` — **không kèm triệu chứng** |
| `google_connected` | `services: calendar,tasks` |
| `extraction_failed` | `error_code` |

`symptom_intake_completed` là ví dụ tốt: biết được bao nhiêu ca ra nhánh cấp cứu (số rất có giá trị cho bài nộp) mà không hề biết ai bị gì.

### Việc phải làm kèm theo

- [ ] Màn xin đồng ý analytics ở lần mở đầu, **mặc định TẮT** cho đến khi người dùng bật
- [ ] Bật `anonymize_ip`
- [ ] Trang chính sách riêng tư — **bắt buộc** nếu sau này nộp verification OAuth
- [ ] Thêm quy tắc vào [23](23-Security-Privacy.md): danh sách trường cấm log

---

## 12. Backend proxy — khi nào cần

Chưa cần cho vòng thi. Cần khi:

- Muốn giấu khoá Gemini/Maps thật sự
- Muốn **nhắc uống thuốc chạy nền dài hạn** (cần refresh token, phải có server giữ)
- Muốn gửi thông báo đẩy
- Muốn kiểm soát chi phí theo từng người dùng

Cách nhẹ nhất: **Cloud Run** (đã nhắc trong [04](04-Huong-dan-Build-Deploy.md), có bậc miễn phí), một endpoint proxy cho Gemini. Ghi vào roadmap của bài nộp là được — không cần làm trước 30/08.
