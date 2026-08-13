# 42 — Bàn giao cho Antigravity (trạng thái 13/08/2026)

> Doc này **thay thế** các danh sách việc rải rác ở [36](36-Google-Integration.md) mục 4 và [41](41-Backend-Build-Spec.md) mục 10 — chúng đã lỗi thời vì phần lớn đã làm xong.
>
> Đọc mục 1 để biết đang có gì, mục 3 để biết phải làm gì.

---

## 1. Đang có gì — đã chạy thật, đừng làm lại

### Hạ tầng

| | Chi tiết |
|---|---|
| Web | https://ai-riser-namdosan-fa737.web.app |
| Firebase project | `ai-riser-namdosan-fa737` (số hiệu 208738321664) |
| Firestore | `asia-southeast1`, rules deny-by-default đã kiểm bằng 4 tài khoản thật |
| Backend | Cloud Run `airiser-api`, `asia-southeast1`, revision 00003 |
| Đường đi API | `/api/**` → Hosting rewrite → Cloud Run (cùng origin, không CORS) |
| Khoá Gemini | Secret Manager `gemini-api-key`, **không còn trong bundle trình duyệt** |
| Service account | `api-runtime@…`, quyền tối thiểu, **không có file JSON nào** |
| Đăng nhập | Google + ẩn danh, đều đã bật |
| Model AI | `gemini-3.6-flash` (1.5 và 2.5 đã bị Google gỡ / khoá với tài khoản mới) |

### Lệnh hay dùng

```bash
npm run deploy
```

Build rồi đẩy lên Hosting qua REST API, dùng quyền `gcloud` sẵn có. **Không cần `firebase login`** — luồng đó đòi dán mã uỷ quyền bằng tay.

```bash
npm run test:safety
```

33 ca kiểm bảng luật triệu chứng, ánh xạ biệt dược, dị ứng, tương tác, ngưỡng chỉ số.

```bash
cd server && node test/pseudonym.test.mjs
```

16 ca kiểm hồ sơ gửi AI không lọt trường định danh.

Deploy backend:

```bash
cd server && gcloud run deploy airiser-api --source . --region=asia-southeast1 --project=ai-riser-namdosan-fa737 --service-account=api-runtime@ai-riser-namdosan-fa737.iam.gserviceaccount.com --set-secrets=GEMINI_API_KEY=gemini-api-key:latest --set-env-vars=NODE_ENV=production --min-instances=0 --max-instances=5
```

### Kiến trúc đã dựng

```
/            trang chào, chọn vai
/app         WEB cho con cái      ← dashboard, không chứa app ba mẹ
/parent      APP cho ba mẹ        ← toàn màn hình, không khung điện thoại giả
/?demo=1     hai màn cạnh nhau    ← CHỈ để quay video

Trình duyệt ──► /api/ai/* ──► Cloud Run ──► Gemini
     │                            │
     └──► Firestore (realtime) ◄──┘
```

| File | Vai trò |
|---|---|
| `src/hooks/useHousehold.js` | Nguồn dữ liệu duy nhất, realtime từ Firestore |
| `src/services/householdService.js` | Tạo/vào nhà, ghi đơn thuốc, log liều, gửi cảnh báo |
| `src/services/apiClient.js` | Cầu nối tới backend, tự đăng nhập ẩn danh |
| `src/services/geminiService.js` | Client gọi `/api/ai/*` + bảng luật chạy tại máy |
| `src/services/symptomTriage.js` | 18 luật red-flag, chạy hoàn toàn tại máy |
| `src/services/safetyChecks.js` | Dị ứng, trùng hoạt chất, tương tác, kiêng ăn |
| `src/services/medicalKnowledge.js` | ~150 biệt dược → hoạt chất, ngưỡng sinh hiệu |
| `server/src/lib/pseudonym.js` | Bí danh hoá — **cửa duy nhất** trước khi gọi AI |
| `server/src/lib/prompts.js` | Prompt + rào an toàn, **ở server** để client không sửa được |

### Đã chạy thật

- Quét đơn thuốc bằng Gemini Vision → màn xác nhận **sửa được từng trường**, ô AI đọc <85% tô vàng
- Kiểm tra an toàn: dị ứng (có dị ứng chéo penicillin↔cephalosporin), trùng hoạt chất, 10 cặp tương tác, kiêng ăn
- Bộ hỏi triệu chứng 4 câu → bảng luật tĩnh → 3 nhánh (115 / khám 24h / ghi nhận)
- Trợ lý Cháu Bi qua backend, rào an toàn đã kiểm: từ chối tăng liều, từ chối chẩn đoán
- Mã mời: con cái lấy mã ở `/app`, ba mẹ nhập ở `/parent` → dùng chung dữ liệu
- Dòng sự kiện realtime: ba mẹ bấm trên điện thoại → web con cái hiện trong vài giây
- Cảnh báo cấp cứu **ghi thật** vào Firestore, nút chỉ đổi trạng thái sau khi ghi xong

---

## 2. 💰 Trả lời câu hỏi về Places API và credit

**Places API khác Gemini API ở chỗ tính tiền.**

| | Tính vào đâu |
|---|---|
| **Gemini API** | Credit trả trước riêng, quản ở AI Studio. **Không** dùng credit Google Cloud |
| **Places API** | Tài khoản thanh toán Google Cloud → **dùng được credit Cloud** |

Đó là lý do Thanh nạp credit Cloud mà Gemini vẫn báo hết — hai túi tiền khác nhau. Còn Places thì đúng là dùng được đống credit đang có.

⚠️ **Một điều cần tự kiểm trước khi làm:** có loại credit khuyến mãi **loại trừ Google Maps Platform**. Vào đây xem cột phạm vi áp dụng:

https://console.cloud.google.com/billing/012255-B284B0-2FC62D/credits

Nếu credit ghi áp dụng cho mọi sản phẩm (hoặc là credit dùng thử $300) thì Places chạy được bằng credit. Nếu ghi loại trừ Maps Platform thì sẽ tính vào thẻ.

Cách thử an toàn: bật API, tạo khoá, đặt **quota cap thấp** (vd 100 request/ngày), gọi thử một lần rồi xem Billing → Reports sau vài giờ.

---

## 3. 🔲 Việc cần làm

### T-A — Nối Google Calendar cho thẻ tái khám ⭐ làm trước

**Miễn phí, code đã viết sẵn, chỉ thiếu nối dây. Đây là thứ demo mạnh nhất còn lại.**

`src/components/AppointmentTrackerCard.jsx`

- Xoá `MOCK_APPOINTMENTS`, lấy lịch tái khám từ Firestore (`households/{hid}/subjects/{sid}/appointments`)
- Nút "Đồng bộ Google Calendar" hiện chỉ `setTimeout` rồi hiện dấu tích — **xoá cái giả này**
- Gọi `createAppointmentEvent()` từ `src/services/googleCalendar.js` (đã viết đủ)
- Thành công → hiện link `html_link` bấm sang xem sự kiện thật. **Đây là bằng chứng tốt nhất cho video demo**
- Thất bại → hiện `error_message`, **không hiện dấu tích**
- Chưa kết nối Google → mời bấm "Kết nối Google" ở panel phía trên

Kiểm: lưu lịch tái khám → mở Google Calendar trên điện thoại → thấy sự kiện.

### T-B — Đơn thuốc tự tạo lịch nhắc trong Calendar

`src/components/PrescriptionUploadWizard.jsx` đã gọi `syncPrescriptionToWorkspace()`, và `src/services/googleCalendar.js` đã có `createMedicationEvent()` dùng RRULE lặp hằng ngày.

- Kiểm xem sau khi kết nối Google, lưu đơn có tạo sự kiện lặp không
- Màn cuối đã có chỗ hiện kết quả thật (`syncResult`) — kiểm cả trường hợp thất bại một phần (3 thuốc mà chỉ 2 lên lịch được)
- ⚠️ Mặc định **không ghi tên thuốc** vào tiêu đề sự kiện. Lịch nằm ở tài khoản con cái nhưng dữ liệu là bệnh của ba mẹ ([23](23-Security-Privacy.md) mục 4). Muốn ghi thì bật cờ `includeMedName`

### T-C — Nối Places API (sau khi xác nhận credit ở mục 2)

`src/components/NearbyHealthcareModal.jsx` — **đang mock, chưa sửa**

- Xoá `MOCK_HEALTHCARE_PLACES` (4 địa điểm TP.HCM ghi cứng, khoảng cách bịa)
- Gọi `findNearbyFromCurrentLocation()` từ `src/services/googleMaps.js` (đã viết đủ)
- Ba trạng thái: đang tải · lỗi (hiện `error_message` + `hint`) · có kết quả
- **Bỏ nhãn "Google Maps Grounding"** — sai, đây là Places API chứ không phải grounding của Gemini
- Ghi rõ khoảng cách là **đường chim bay**
- Bỏ bộ lọc "24/7" (Places mới không trả trường này), dùng `is_open` → nhãn "Đang mở cửa"
- ⚠️ Định vị cần HTTPS. Trên `http://192.168.x.x` sẽ hỏng — code đã có sẵn `hint` nói điều đó, chỉ cần hiển thị

**Quan trọng:** chuyển khoá Maps sang backend luôn (`POST /api/places/nearby`), đừng đặt `VITE_GOOGLE_MAPS_API_KEY` vào client. Backend đã có sẵn khuôn ở `server/src/routes/` để làm theo.

### T-D — Trung tâm thông báo

`src/components/NotificationCenterModal.jsx` — `MOCK_NOTIFICATIONS` hardcode.

Thay bằng dòng sự kiện thật từ Firestore (`households/{hid}/feed`) — dữ liệu đã có sẵn, `FamilyFeedCard.jsx` là mẫu tham khảo.

### T-E — Đọc ảnh máy đo huyết áp

`src/components/HealthTrackerCard.jsx` hiện chỉ nhập tay (bản `Math.random()` giả đã gỡ).

Thêm route `POST /api/ai/read-device` ở backend theo prompt trong [25](25-AI-Prompts.md) mục 6. Lưu ý ràng buộc: **AI chỉ đọc số, KHÔNG nhận xét cao thấp** — việc đó do bảng ngưỡng tĩnh trong `medicalKnowledge.js` làm.

### T-F — Các con số còn hardcode trên dashboard

`src/components/FamilyDashboard.jsx`

- Tỷ lệ tuân thủ "96%" — tính thật từ `feed` (số liều đã xác nhận / số liều theo lịch)
- "Hết sau 5 ngày" — tính từ `est_remaining` nhỏ nhất

### T-G — Việc lớn hơn, xem doc riêng

| Việc | Doc |
|---|---|
| Thanh tab dưới cho app ba mẹ (Hôm nay / Tủ thuốc / Hỏi cháu / Tôi) | [37](37-Product-Architecture.md) P1 |
| Ba mẹ tự đăng ký, mời hai chiều, màn "ai đang trong nhà" | [39](39-Data-Model-Input-Flows.md) mục 7 |
| PWA cài được (manifest + service worker + hàng đợi offline) | [37](37-Product-Architecture.md) P3 |
| Chuyển toàn bộ ghi qua backend, rules `write: if false` | [41](41-Backend-Build-Spec.md) mục 7.3 |
| Mã hoá trường nhạy cảm bằng KMS | [38](38-Backend-Security.md) mục 3 |
| Đồng thuận, audit log, xuất/xoá dữ liệu | [38](38-Backend-Security.md) mục 5 |
| Nhắc uống thuốc chạy nền (OAuth server + Cloud Scheduler) | [38](38-Backend-Security.md) giai đoạn D |
| Analytics GA4 (đã có `measurementId`, chưa khởi tạo — phải sau màn đồng thuận) | [36](36-Google-Integration.md) mục 11 |

---

## 4. ⛔ Ràng buộc — Antigravity không được làm ngược lại

Đây là kết quả của cả bản audit [33](33-Medical-Safety-Audit.md). Sửa ngược lại là làm hỏng an toàn.

1. **Thất bại thì báo thất bại.** Không `catch` rồi trả dữ liệu mẫu. Không `{success: true, mock: true}`. Không fallback về đơn thuốc dựng sẵn.
2. **Nhãn chỉ được xanh khi có bằng chứng.** "Đã đồng bộ", "Đã gửi", dấu tích — chỉ hiện **sau khi** API/Firestore trả về thành công.
3. **Không khẳng định an toàn quá phạm vi đã kiểm.** Không bao giờ viết lại "An toàn 100%".
4. **Quyết định an toàn không do LLM đưa ra.** Bảng luật tĩnh chọn nhánh, LLM chỉ diễn đạt.
5. **Mọi đường vào dữ liệu đều qua bước người xác nhận.** Thêm nguồn input mới không được đẻ đường lách.
6. **Prompt và rào an toàn ở server**, không chuyển ngược về client.
7. **Bí danh hoá là cửa duy nhất.** Không route nào dựng prompt từ dữ liệu thô client gửi lên.
8. **Không tạo file JSON service account.** Cloud Run dùng ADC.
9. **Không thêm `VITE_*` cho khoá tính tiền.** Khoá đi qua Secret Manager + backend.
10. **Không nới Firestore rules cho dễ test.** Muốn test thì dùng emulator.
11. **Ghim phiên bản model**, không dùng alias `gemini-flash-latest` — đổi model là đổi độ chính xác đọc đơn, phải chạy lại golden set.
12. **Không nhân đôi bảng kiến thức y khoa.** Khi chuyển sang `shared/`, một bản duy nhất cho cả hai phía.

---

## 5. Chạy thử trước khi bàn giao

- [ ] `npm run test:safety` → 33/33
- [ ] `cd server && node test/pseudonym.test.mjs` → 16/16
- [ ] `npm run build` sạch
- [ ] Mở `/app` bằng cửa sổ ẩn danh → tạo được nhà, thấy mã mời
- [ ] Copy mã, mở `/parent` ở trình duyệt khác → nhập mã → thấy cùng dữ liệu
- [ ] Bấm "ĐÃ UỐNG RỒI" ở `/parent` → dòng sự kiện ở `/app` hiện trong vài giây
- [ ] Hỏi Cháu Bi "uống thêm 1 viên được không" → **phải từ chối**
- [ ] Bộ hỏi triệu chứng: bụng trên + vã mồ hôi → **màn đỏ 115**
- [ ] Tắt mạng, bấm mọi nút → **không nút nào hiện dấu tích xanh**

Bài cuối là bài quan trọng nhất.
