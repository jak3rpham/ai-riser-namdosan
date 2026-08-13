# 41 — Đặc tả dựng Backend (giao cho Antigravity)

> Trả lời câu hỏi của Thanh: *"google có nguồn server nào để hosting không, hay các khoá secret gì đó để trong google ecosystem app luôn chứ t không muốn nó bị phụ thuộc vào máy t và có thể bị lộ dễ dàng qua inspect"*
>
> **Có, đủ cả.** Code chạy trên máy chủ Google, khoá nằm trong kho khoá của Google, máy Thanh không giữ gì cả.
>
> Đọc kèm [38](38-Backend-Security.md) (kiến trúc & bảo mật) và [39](39-Data-Model-Input-Flows.md) (mô hình dữ liệu).

---

## 1. Mọi thứ đều nằm trong hệ sinh thái Google

| Cần gì | Dịch vụ Google | Vai trò |
|---|---|---|
| Chỗ chạy code backend | **Cloud Run** | Container chạy trên máy chủ Google. Tự co giãn, không có máy nào phải bật 24/7 |
| Chỗ cất khoá | **Secret Manager** | Khoá nằm trong kho có kiểm soát truy cập. Không nằm trong repo, không nằm trong `.env`, không nằm trên máy Thanh |
| Chỗ build | **Cloud Build** | Google tự lấy code từ GitHub, build, deploy. Máy Thanh không tham gia |
| Chỗ chứa image | **Artifact Registry** | |
| Hẹn giờ nhắc thuốc | **Cloud Scheduler** | |
| Khoá mã hoá dữ liệu | **Cloud KMS** | Khoá gốc không tải về được, kể cả Thanh |
| CSDL | **Firestore** | Đã có |
| Web tĩnh | **Firebase Hosting** | Đã có |

Máy Thanh chỉ dùng để **viết code**. Không giữ khoá sản xuất, không phải bật để app chạy.

## 2. Sau khi có backend, "inspect" thấy được gì

Đây là câu trả lời trực tiếp cho lo ngại lộ khoá.

### Bây giờ (chưa có backend)

```
Bấm F12 → Sources → thấy:
  ❌ VITE_GEMINI_API_KEY      = "AIza..."   ← ai cũng lấy được
  ❌ VITE_GOOGLE_MAPS_API_KEY = "AIza..."   ← ai cũng lấy được
```

### Sau khi có backend

```
Bấm F12 → Sources → thấy:
  ✅ firebaseConfig  ← vốn là định danh công khai, không phải mật khẩu
  ✅ lời gọi tới /api/... của chính mình

Không thấy, vì chúng chưa từng rời khỏi máy chủ Google:
  · khoá Gemini
  · khoá Maps
  · refresh token Google của người dùng
  · khoá mã hoá dữ liệu
```

Người dùng vẫn gọi được `/api/ai/ask` — nhưng phải **đăng nhập, đúng người, và trong hạn mức**. Khác hẳn với việc cầm khoá thô muốn gọi bao nhiêu cũng được.

---

## 3. Sơ đồ triển khai

```
   GitHub (repo)
        │  push lên nhánh main
        ▼
   Cloud Build          ← Google build, không phải máy Thanh
        │
        ▼
   Artifact Registry
        │
        ▼
   Cloud Run  ──────────────┐
   asia-southeast1          │ đọc khoá lúc chạy
   service account riêng    ▼
        ▲            Secret Manager
        │
        │  /api/**  (rewrite, cùng origin → không dính CORS)
        │
   Firebase Hosting  ←── người dùng vào đây
   (web tĩnh đã build)
```

### Cùng origin nhờ rewrite

`firebase.json` thêm một dòng rewrite, đặt **trước** rewrite SPA:

```json
"rewrites": [
  { "source": "/api/**",
    "run": { "serviceId": "airiser-api", "region": "asia-southeast1" } },
  { "source": "**", "destination": "/index.html" }
]
```

Lợi ích: frontend gọi `/api/...` như gọi chính mình. Không cấu hình CORS, không lộ URL Cloud Run, không cần domain riêng cho API.

⚠️ Thứ tự quan trọng. Để rewrite SPA lên trước thì mọi request `/api` sẽ trả về `index.html`.

---

## 4. Cấu trúc thư mục

Thêm `server/` cạnh `src/` hiện có:

```
/
├── src/                      frontend hiện tại
├── server/
│   ├── src/
│   │   ├── index.ts              khởi động Fastify
│   │   ├── plugins/
│   │   │   ├── auth.ts           xác thực Firebase ID token
│   │   │   ├── rateLimit.ts      hạn mức theo uid
│   │   │   └── audit.ts          ghi nhật ký truy cập
│   │   ├── lib/
│   │   │   ├── firebase.ts       Admin SDK, dùng ADC
│   │   │   ├── secrets.ts        đọc Secret Manager
│   │   │   ├── crypto.ts         mã hoá trường bằng KMS
│   │   │   └── pseudonym.ts      buildPseudonymousProfile()
│   │   ├── domain/
│   │   │   ├── permissions.ts    bảng vai ở doc 39
│   │   │   ├── prescriptions.ts
│   │   │   └── consent.ts
│   │   ├── routes/
│   │   │   ├── ai.ts             proxy Gemini
│   │   │   ├── places.ts         proxy Maps
│   │   │   ├── households.ts
│   │   │   ├── subjects.ts
│   │   │   └── me.ts             xuất / xoá dữ liệu
│   │   └── schemas/              zod cho mọi đầu vào
│   ├── test/
│   │   ├── rules.test.ts         test Firestore rules bằng emulator
│   │   ├── permissions.test.ts
│   │   └── pseudonym.test.ts     khẳng định không lọt định danh
│   ├── package.json
│   └── tsconfig.json
├── shared/                   dùng chung frontend & backend
│   ├── medicalKnowledge.ts       chuyển từ src/services/
│   ├── safetyChecks.ts
│   └── symptomTriage.ts
└── firebase.json
```

> **Chuyển ba file kiến thức y khoa sang `shared/`.** Kiểm tra an toàn phải chạy được ở **cả hai phía**: frontend để hiện cảnh báo ngay lúc gõ, backend để chốt lần cuối trước khi ghi. Không được để hai bản khác nhau — cùng một bảng luật, cùng một phiên bản.
>
> Bộ test `tests/safety.test.mjs` (33 ca) giữ nguyên, chỉ đổi đường dẫn import.

---

## 5. Thứ tự middleware — không được đổi

Mọi request đi qua đúng dãy này:

```
1. Kiểm Firebase ID token          → 401 nếu sai
2. Nạp vai của người dùng          → từ households/{id}/grants/{uid}
3. Kiểm quyền cho thao tác này     → 403 nếu không đủ
4. Kiểm đồng thuận còn hiệu lực    → 403 nếu đã rút
5. Validate đầu vào bằng zod       → 400 nếu sai
6. Hạn mức theo uid                → 429 nếu vượt
7. Chạy nghiệp vụ
8. Ghi audit log
9. Trả kết quả
```

Bước 8 chạy **kể cả khi bước 7 lỗi**. Cố truy cập mà bị chặn cũng là thứ cần ghi lại.

### Hợp đồng lỗi — dùng chung với frontend

Giữ đúng dạng lỗi mà client đang xử lý (`googleAuth.js` đã theo mẫu này):

```json
{ "ok": false,
  "error_code": "PERMISSION_DENIED",
  "error_message": "Câu tiếng Việt nói rõ phải làm gì" }
```

**Không bao giờ trả dữ liệu giả khi lỗi.** Đây là nguyên tắc đã chốt ở [35](35-Safety-Fixes-Log.md) mục 5 và là lý do tồn tại của cả bản audit.

---

## 6. Danh sách endpoint

| Method | Đường dẫn | Vai tối thiểu | Ghi chú |
|---|---|---|---|
| POST | `/api/households` | đã đăng nhập | Người tạo thành `host` |
| GET | `/api/households/:id` | family | |
| POST | `/api/households/:id/invites` | family | Mã 72h, dùng một lần |
| POST | `/api/invites/:code/accept` | đã đăng nhập | Vào với vai `family` hoặc `subject` |
| DELETE | `/api/households/:id/grants/:uid` | **host** | Chỉ host mời ra được |
| PATCH | `/api/households/:id/grants/:uid` | **host** | Đổi vai |
| POST | `/api/subjects` | family | Tạo hồ sơ ba mẹ |
| PATCH | `/api/subjects/:id` | family, hoặc `subject` **của chính mình** | |
| POST | `/api/subjects/:id/prescriptions` | family, hoặc `subject` của chính mình | Chạy lại kiểm tra an toàn phía server |
| POST | `/api/subjects/:id/doses` | family hoặc subject | Chạy được offline, đồng bộ sau |
| POST | `/api/subjects/:id/vitals` | family hoặc subject | |
| POST | `/api/subjects/:id/symptoms` | family hoặc subject | Lưu cả `rule_id` và `rules_version` |
| POST | `/api/ai/extract-prescription` | family hoặc subject | Chặng 1 — có định danh |
| POST | `/api/ai/ask` | family hoặc subject | Chặng 2 — hồ sơ bí danh |
| POST | `/api/ai/explain` | family hoặc subject | Chặng 2 |
| POST | `/api/places/nearby` | đã đăng nhập | Cache theo toạ độ làm tròn |
| POST | `/api/google/connect` | family | OAuth phía server, giữ refresh token |
| GET | `/api/me/export` | đã đăng nhập | |
| DELETE | `/api/me` | đã đăng nhập | Có thời gian ân hạn |
| GET | `/api/households/:id/members` | family | Ba mẹ xem được, không có nút thu hồi |

---

## 7. Ba chỗ dễ làm sai nhất

### 7.1 Bí danh hoá — mọi lời gọi AI phải đi qua một cửa

```ts
// lib/pseudonym.ts
export async function buildPseudonymousProfile(subjectId: string) {
  // Trả về CHỈ các trường ở doc 38 mục 10.
  // Không bao giờ trả display_name, birth_year, doctor_name, facility_name.
}
```

Route AI **không được** đọc thẳng document rồi nhét vào prompt. Có test tự động canh chuyện này (mục 8).

Ngoại lệ duy nhất: `/api/ai/extract-prescription` — ảnh có tên in trên giấy. Sau khi trích xuất, **cắt ngay** `patient_name`, `doctor_name`, `facility_name` trước khi lưu.

### 7.2 Kiểm tra an toàn phải chạy lại ở server

Frontend đã chạy `runAllSafetyChecks()`, nhưng **không được tin**. Ai cũng gọi thẳng API được.

Server chạy lại đúng bộ kiểm đó từ `shared/`, và **từ chối ghi** nếu có cảnh báo `CRITICAL` mà request không kèm cờ `acknowledged_critical: true` (nghĩa là người dùng đã thấy và cố ý bỏ qua — được phép, nhưng phải ghi lại ai bỏ qua, lúc nào).

### 7.3 Firestore Rules sau khi có backend

Ghi chuyển hết sang backend, rules còn hai việc: cho **đọc** đúng phạm vi, và **chặn ghi**.

```
match /care_subjects/{sid}/{doc=**} {
  allow read: if inHousehold(householdOf(sid));
  allow write: if false;          // chỉ Admin SDK ghi, bỏ qua rules
}
```

Admin SDK bỏ qua rules nên backend vẫn ghi được. Client thì không.

---

## 8. Test bắt buộc — chạy trong CI, chặn merge nếu đỏ

Đây là thứ giữ cho tốc độ không ăn mòn an toàn.

| Test | Kiểm gì |
|---|---|
| `rules.test.ts` | Người nhà A **không đọc được** dữ liệu nhà B. Client **không ghi được** gì. Dùng `@firebase/rules-unit-testing` + emulator |
| `permissions.test.ts` | Bảng vai ở doc 39 đúng từng ô. `subject` không sửa được hồ sơ người khác. Chỉ `host` mời ra được |
| `pseudonym.test.ts` | Hồ sơ gửi AI **không chứa** `display_name`, `birth_year`, `doctor_name`, `facility_name`, `phone`, `email`. Thêm trường mới mà quên là đỏ ngay |
| `safety.test.mjs` | 33 ca hiện có, giữ nguyên |
| `error-contract.test.ts` | Mọi route lỗi đều trả `{ok:false, error_code, error_message}`, không route nào trả dữ liệu mẫu |

---

## 9. Các bước triển khai

### 9.1 Bật dịch vụ — việc của Thanh

Xem [38](38-Backend-Security.md) mục 11. Tóm tắt: nâng Blaze, bật 5 API, tạo service account `api-runtime` với quyền tối thiểu.

### 9.2 Đưa khoá vào Secret Manager

```bash
gcloud secrets create gemini-api-key --replication-policy=automatic
```

```bash
printf 'KHOA_CUA_BAN' | gcloud secrets versions add gemini-api-key --data-file=-
```

Làm tương tự với `maps-api-key`, `oauth-client-secret`.

> Dùng `printf` chứ không `echo` để không dính ký tự xuống dòng ở cuối khoá — lỗi này rất khó tìm.

### 9.3 Deploy Cloud Run

```bash
gcloud run deploy airiser-api --source ./server --region asia-southeast1 --service-account api-runtime@PROJECT_ID.iam.gserviceaccount.com --set-secrets=GEMINI_API_KEY=gemini-api-key:latest,MAPS_API_KEY=maps-api-key:latest --no-allow-unauthenticated
```

Không cần Dockerfile — Cloud Buildpacks tự nhận diện Node.

`--no-allow-unauthenticated`: chỉ Firebase Hosting gọi vào được, không ai gọi thẳng URL Cloud Run.

### 9.4 Nối Hosting vào

Sửa `firebase.json` theo mục 3, rồi:

```bash
npm run build && firebase deploy --only hosting,firestore:rules
```

### 9.5 Tự động hoá — máy Thanh hết vai trò

Cloud Console → **Cloud Build → Triggers → Create trigger**, nối vào repo GitHub, nhánh `main`.

Từ lúc này: push code → Google tự build và deploy. Máy Thanh **không giữ khoá sản xuất nào**.

### 9.6 Dọn phía client

- [ ] Xoá `VITE_GEMINI_API_KEY` và `VITE_GOOGLE_MAPS_API_KEY` khỏi `.env` và `.env.example`
- [ ] `geminiService.js` → gọi `/api/ai/*`
- [ ] `googleMaps.js` → gọi `/api/places/nearby`
- [ ] **Thu hồi rồi tạo lại hai khoá đó** — chúng đã từng nằm trong bundle nên phải coi là đã lộ
- [ ] `.env` client chỉ còn 6 biến `VITE_FIREBASE_*`

---

## 10. Thứ tự làm

| Bước | Nội dung | Xong thì kiểm bằng |
|---|---|---|
| B1 | Cloud Run chạy được `/api/health` | `curl` qua domain Hosting trả 200 |
| B2 | Middleware xác thực + vai | Gọi không token → 401. Sai vai → 403 |
| B3 | Proxy Gemini + hạn mức | Quét đơn vẫn chạy; F12 **không còn thấy khoá** |
| B4 | Bí danh hoá + test | `pseudonym.test.ts` xanh |
| B5 | Chuyển ghi sang API, siết rules | `rules.test.ts` xanh; client ghi thẳng → bị từ chối |
| B6 | Proxy Places | Bỏ nốt khoá thứ hai khỏi client |
| B7 | Mã hoá trường (KMS) | Xem trong Firestore Console thấy chuỗi mã hoá, không đọc được |
| B8 | Đồng thuận + audit + xuất/xoá dữ liệu | Xoá tài khoản → dữ liệu biến mất thật |
| B9 | OAuth phía server + Cloud Scheduler | Nhắc thuốc chạy khi app đóng |

**B3 là mốc đáng ăn mừng** — đó là lúc mở F12 mà không còn thấy khoá nào, tức là đúng điều Thanh muốn.

---

## 11. Ràng buộc Antigravity không được làm ngược lại

Bổ sung cho danh sách ở [36](36-Google-Integration.md) mục 5:

1. **Không tạo file JSON service account.** Cloud Run gắn service account trực tiếp; dùng `applicationDefault()`.
2. **Không đọc khoá từ biến môi trường ghi trong Dockerfile hay `cloudbuild.yaml`.** Chỉ qua Secret Manager.
3. **Không cho phép frontend gọi thẳng API Google nào.** Mọi thứ đi qua `/api/`.
4. **Không nhân đôi bảng kiến thức y khoa.** Một bản duy nhất trong `shared/`.
5. **Không bỏ qua bước người xác nhận** dù dữ liệu vào bằng đường nào ([39](39-Data-Model-Input-Flows.md) mục 3).
6. **Không nới rules cho "dễ test".** Muốn test thì dùng emulator.
