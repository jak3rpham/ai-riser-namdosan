# 40 — Hướng dẫn lấy khoá, làm theo từng bước

> Làm từ trên xuống. Mỗi bước có cách **tự kiểm** ngay tại chỗ, đừng làm hết rồi mới thử.
> Tổng thời gian: khoảng 60–90 phút nếu mọi thứ suôn sẻ.
>
> Đây là việc **chỉ Thanh làm được** — không giao cho Antigravity ([36](36-Google-Integration.md) mục 0).

---

## Chuẩn bị

- [ ] Một tài khoản Google sẽ đứng tên chủ sở hữu sản phẩm. **Đừng dùng tài khoản cá nhân chính** nếu có ý định làm sản phẩm thật — sau này chuyển chủ sở hữu rất phiền
- [ ] Một thẻ thanh toán (cần cho Places API và bậc trả phí Gemini)
- [ ] Đã cài Node 18+

```bash
node -v
```

---

## Bước 1 — Tạo project Firebase (10 phút)

1. Mở [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Tên: `suc-khoe-nha` (hoặc tên khác — nhớ lại tên này, dùng ở nhiều bước sau)
3. Google Analytics: **Bật** — sẽ cần ở mục tracking ([36](36-Google-Integration.md) mục 11)
4. Chờ tạo xong → **Continue**

### Tạo web app

5. Trong project → biểu tượng **`</>`** (Add app → Web)
6. Nickname: `web`. **Tick "Also set up Firebase Hosting"**
7. Màn hình tiếp theo hiện đoạn `firebaseConfig` — **giữ tab này mở**, sắp copy

### ✅ Tự kiểm
Thấy được khối `const firebaseConfig = { apiKey: "AIza...", ... }` với 6 giá trị.

---

## Bước 2 — Bật đăng nhập Google (5 phút)

1. Menu trái → **Build → Authentication → Get started**
2. Tab **Sign-in method** → chọn **Google** → **Enable**
3. Chọn email hỗ trợ → **Save**
4. Tab **Settings → Authorized domains** → **Add domain**, thêm:
   - `localhost`
   - `<tên-project>.web.app`
   - `<tên-project>.firebaseapp.com`

> ⚠️ Thiếu bước 4 → lỗi `auth/unauthorized-domain` khi bấm đăng nhập. Đây là lỗi hay gặp nhất.

### ✅ Tự kiểm
Google hiện trạng thái **Enabled** trong danh sách provider.

---

## Bước 3 — Tạo Firestore (5 phút)

1. **Build → Firestore Database → Create database**
2. Chọn **Start in production mode** — ⚠️ **không** chọn test mode. Test mode để dữ liệu mở toang trong 30 ngày
3. Location: **`asia-southeast1` (Singapore)** — gần VN nhất

> Location **không đổi được sau khi tạo**. Chọn kỹ. Xem thêm cảnh báo về chuyển dữ liệu ra nước ngoài ở [38](38-Backend-Security.md) mục 4.

### ✅ Tự kiểm
Vào tab **Rules**, thấy rule mặc định chặn hết (`allow read, write: if false`). Đúng rồi — sẽ thay bằng `firestore.rules` của dự án sau.

---

## Bước 4 — Điền `.env` lần đầu (5 phút)

```bash
cp .env.example .env
```

Quay lại tab Firebase còn mở ở Bước 1 (hoặc **Project settings → General → Your apps**), copy từng giá trị:

| Trong `firebaseConfig` | Điền vào biến |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

### ⚠️ Rồi xoá giá trị bịa trong code

`src/config/firebaseConfig.js` hiện có fallback `"AIzaSyDemoKeyForAIRiserNamDoSan2026"` và các giá trị hardcode khác. **Xoá hết phần fallback**, chỉ để `import.meta.env.*`. Để lại thì lúc `.env` sai app sẽ âm thầm chạy bằng cấu hình giả thay vì báo lỗi.

### ✅ Tự kiểm

```bash
npm run dev
```

Mở Console trình duyệt — không có lỗi `auth/invalid-api-key`.

---

## Bước 5 — Khoá Gemini (10 phút)

1. Mở [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. **Create API key** → chọn **đúng project Firebase vừa tạo** (quan trọng: dùng chung project thì quản lý chi phí và quota một chỗ)
3. Copy → dán vào `VITE_GEMINI_API_KEY` trong `.env`

### ⚠️ Quyết định bậc miễn phí hay trả phí

Đọc kỹ [36](36-Google-Integration.md) mục 9 trước khi quyết.

| | Bậc miễn phí | Bậc trả phí |
|---|---|---|
| Chi phí | 0 | Theo lượng dùng |
| **Dữ liệu gửi lên** | **Google được dùng để cải thiện sản phẩm** | Không dùng |
| Dùng khi | Tự test bằng đơn thuốc của chính mình | **Bất cứ khi nào có đơn thuốc của người khác** |

→ Còn tự nghịch thì free tier. **Trước khi mời ba mẹ hay bất kỳ gia đình nào dùng thật thì phải bật trả phí.**

### Đặt hạn mức ngay

[console.cloud.google.com](https://console.cloud.google.com) → chọn project → **APIs & Services → Generative Language API → Quotas** → đặt giới hạn request/ngày.

> Budget alert chỉ **gửi mail sau khi đã tiêu tiền**. Quota cap mới là thứ **chặn thật**. Đặt cả hai.

### ✅ Tự kiểm
Chạy app → quét thử một ảnh đơn thuốc → ra danh sách thuốc thay vì màn "chưa đọc được".

---

## Bước 6 — Bật API trong Google Cloud (10 phút)

Project Firebase **chính là** một project Google Cloud.

1. [console.cloud.google.com](https://console.cloud.google.com) → chọn đúng project ở góc trên
2. **APIs & Services → Enable APIs and services**
3. Tìm và bật lần lượt:
   - [ ] **Google Calendar API**
   - [ ] **Google Tasks API**
   - [ ] **Places API (New)** ← chú ý chữ **(New)**, không phải bản cũ

### ✅ Tự kiểm
**APIs & Services → Enabled APIs** liệt kê đủ ba cái.

---

## Bước 7 — Bật thanh toán (10 phút)

Bắt buộc cho Places API.

1. **Billing → Link a billing account** → tạo mới nếu chưa có
2. Nếu có credit khuyến mãi, nó sẽ tự áp vào

### Đặt ngân sách ngay — đừng bỏ qua

3. **Billing → Budgets & alerts → Create budget**
4. Đặt mức thấp lúc đầu, ví dụ 200.000đ/tháng
5. Cảnh báo ở 50% · 90% · 100%

### ✅ Tự kiểm
Billing account hiện trạng thái **Active** và đã liên kết đúng project.

---

## Bước 8 — Khoá Maps (10 phút)

1. **APIs & Services → Credentials → Create credentials → API key**
2. Đổi tên thành `maps-web` cho dễ nhớ
3. Bấm vào khoá vừa tạo để chỉnh:

**Application restrictions** → chọn **Websites**, thêm:
```
http://localhost:3000/*
https://<tên-project>.web.app/*
```

**API restrictions** → chọn **Restrict key** → chỉ tick **Places API (New)**

4. Copy khoá → dán vào `VITE_GOOGLE_MAPS_API_KEY`

> ⚠️ Không giới hạn khoá = ai copy khoá từ bundle cũng gọi được, **và Thanh trả hoá đơn**.

### ✅ Tự kiểm
Chạy `npm run dev:https` (Places cần định vị, mà định vị cần HTTPS) → mở màn tìm nhà thuốc → ra địa điểm **quanh chỗ đang ngồi**, không phải danh sách TP.HCM cố định.

---

## Bước 9 — OAuth consent screen (15 phút, chỗ dễ sai nhất)

1. **APIs & Services → OAuth consent screen**
2. User Type: **External** → Create
3. Điền:
   - App name: `Sức Khỏe Nhà`
   - User support email
   - App logo (tuỳ chọn — thêm logo sẽ kích hoạt yêu cầu xác minh thương hiệu, giai đoạn đầu nên bỏ trống)
   - Developer contact email
4. **Scopes → Add or remove scopes** → thêm:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
   - `.../auth/calendar.events`
   - `.../auth/tasks`

### ⚠️ Chọn trạng thái xuất bản

**Publishing status → Publish app** (chuyển sang *In production*), **không nộp verification**.

Lý do đã giải thích ở [37](37-Product-Architecture.md) mục 3, tóm tắt:

| Trạng thái | Người ngoài danh sách test |
|---|---|
| Testing | **Bị chặn thẳng**, không bấm tiếp được |
| In production, chưa xác minh | Hiện cảnh báo nhưng **bấm tiếp được** qua "Nâng cao" |

Hai scope đầu (`email`, `profile`, `openid`) **không phải sensitive** → đăng nhập bình thường, không cảnh báo, không giới hạn. Chỉ khi bấm "Kết nối Lịch" mới gặp màn cảnh báo.

### ✅ Tự kiểm — bài quan trọng nhất trong cả hướng dẫn

Mở **cửa sổ ẩn danh**, dùng **một tài khoản Google khác** (không phải tài khoản chủ project):

- [ ] Đăng nhập vào app → vào được, **không có màn cảnh báo nào**
- [ ] Dùng được đầy đủ: quét đơn, lưu, xem cảnh báo an toàn
- [ ] Bấm "Kết nối Lịch" → hiện cảnh báo "Google chưa xác minh ứng dụng này" → bấm **Nâng cao → Đi tới** → cấp quyền được

Đây đúng là thứ ban giám khảo và người dùng đầu tiên sẽ thấy.

---

## Bước 10 — Deploy (10 phút)

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

```bash
npm run build && firebase deploy --only hosting,firestore:rules
```

### ✅ Tự kiểm
Mở `https://<tên-project>.web.app` trên **điện thoại** → đăng nhập được → quét được đơn.

---

## Bảng tổng kết: khoá nào ở đâu

| Biến | Lấy ở đâu | Bí mật? |
|---|---|---|
| `VITE_FIREBASE_*` (6) | Firebase Console → Project settings | Không — là định danh công khai |
| `VITE_GEMINI_API_KEY` | AI Studio | Tính tiền — phải giới hạn |
| `VITE_GOOGLE_MAPS_API_KEY` | Cloud Console → Credentials | Tính tiền — phải giới hạn |

Giải thích ba loại khoá: [36](36-Google-Integration.md) mục 10.

---

## Khi có backend thì thêm gì

Chưa cần bây giờ. Ghi lại để sau khỏi tìm ([38](38-Backend-Security.md)):

| Thứ | Lấy ở đâu | Lưu ở đâu |
|---|---|---|
| OAuth **Client Secret** | Cloud Console → Credentials → OAuth 2.0 Client IDs | **Secret Manager**, không bao giờ ở client |
| Service account JSON | IAM → Service Accounts | Secret Manager |
| Khoá mã hoá KMS | Security → Key Management | Không tải về, chỉ tham chiếu |

Lúc đó `VITE_GEMINI_API_KEY` và `VITE_GOOGLE_MAPS_API_KEY` sẽ **bị xoá khỏi client**, chuyển hết sang backend.

---

## Gặp lỗi thì tra ở đây

| Lỗi | Nguyên nhân | Sửa |
|---|---|---|
| `auth/unauthorized-domain` | Domain chưa nằm trong Authorized domains | Bước 2.4 |
| `auth/operation-not-allowed` | Chưa bật Google provider | Bước 2.2 |
| `auth/invalid-api-key` | `.env` sai hoặc chưa restart dev server | Bước 4. Sửa `.env` phải **khởi động lại** vite |
| Places trả 403 `has not been used` | Chưa bật Places API (New) | Bước 6 |
| Places trả 403 `referer` | Khoá chặn domain hiện tại | Bước 8 |
| Places trả 400 `billing` | Chưa bật thanh toán | Bước 7 |
| Định vị không chạy trên iPhone | Đang mở qua `http://` | `npm run dev:https` ([34](34-Testing-On-iPhone.md)) |
| Người khác đăng nhập bị chặn | Consent screen còn ở Testing | Bước 9 |
| Gemini trả 429 | Vượt hạn mức free tier | Chờ, hoặc bật trả phí |

---

## Về ý tưởng tạo tài khoản Gmail giả cho giám khảo

> *"t sẽ muốn tạo sẵn những tài khoản gmail clone user để trực tiếp trải nghiệm full tính năng"* — Thanh ghi chú đây là việc sau cùng.

Mục tiêu thì đúng: giám khảo không nên phải tự dựng gì cả. Nhưng tạo nhiều tài khoản Gmail để giả làm người dùng là chuyện **dễ va vào điều khoản của Google**, và tài khoản bị khoá giữa vòng chấm thì hỏng luôn phần demo.

Cách đạt đúng mục tiêu đó mà không phải tạo Gmail giả:

1. **Tài khoản demo bằng email + mật khẩu** — bật thêm provider Email/Password trong Firebase Auth, tạo sẵn `giamkhao1@...` với dữ liệu mẫu đầy đủ. Không cần Gmail thật, không đụng điều khoản.
2. **Chế độ "Dùng thử ngay"** — Tầng 0 ở [37](37-Product-Architecture.md) mục 3, không cần đăng nhập gì.
3. **Một gia đình mẫu chỉ đọc** để xem dashboard đã có dữ liệu nhiều ngày trông ra sao.

Cả ba cách này Thanh tự làm được, và cách 1 còn tiện hơn Gmail giả vì đặt lại dữ liệu bằng một script là xong.
