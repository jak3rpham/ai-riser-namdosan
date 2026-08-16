# 48 — Handoff (16/08/2026, cuối phiên chiều)

> ⚠️ **ĐÃ LỖI THỜI — dùng [50](50-Handoff.md).**
>
> Mục 1 (audit bốn trục) đã làm xong. Mục 5 ("chưa ai bấm thử") giờ phần lớn
> đã thử — xem doc 50 mục 4. Đừng lấy trạng thái từ đây.


> ⚠️ Tài liệu này **thay thế** [47](47-Handoff.md), vốn đã lệch thực tế khá xa
> sau một phiên dài. Doc 47 vẫn đúng về *lý do* các quyết định kiến trúc —
> đọc mục 6 của nó — nhưng danh sách việc và trạng thái thì dùng doc này.
>
> Còn **14 ngày** tới hạn nộp 23:59 30/08/2026.

---

## 1. Việc của phiên sau

**Audit toàn bộ app.** Không phải thêm tính năng. Phiên 16/08 đẩy vào rất
nhiều thứ mới và phần lớn **chưa ai bấm thử bằng tay** — xem mục 5.

Bốn trục, theo thứ tự:

### 1.1 Chức năng — cái gì hỏng, cái gì hứa mà không làm

Đi hết từng luồng, bấm thật, trên điện thoại thật:

- Tạo nhà → khai hồ sơ → quét đơn thuốc → xác nhận liều
- Tạo mã mời → máy thứ hai nhập mã → chọn "tôi là ai" → khai hồ sơ mới
- Chọn lại danh tính · đăng xuất · vào lại bằng mã mới
- Hỏi Cháu Bi: câu về thuốc · câu triệu chứng · câu cấp cứu · câu té ngã
- Nói bằng giọng (màn hình nói mới) trên cả Chrome Android và Safari iOS
- Quét đơn thuốc lúc **mất mạng** — phải báo lỗi thật, không được bịa đơn

Cách soi: mỗi màn hình tự hỏi *"app đang hứa gì?"* rồi kiểm chứng nó làm
thật. Lỗi nặng nhất phiên này tìm được đều thuộc dạng đó — app nói "để con
hỏi bác vài câu" rồi im, app hiện đơn thuốc bịa khi Gemini lỗi.

### 1.2 Điều hướng — hạng mục còn thiếu hẳn

Chủ dự án nêu: app **chưa có menu hay điều hướng** đúng nghĩa.

Hiện trạng: app Con là một trang dài cuộn, các modal mở từ Navbar; app Ba Mẹ
có 4 tab dưới đáy. Không có đường đi lùi, không có chỗ nào thấy "mình đang ở
đâu", và một số việc chỉ vào được bằng cách cuộn xuống đúng chỗ.

Cần quyết trước khi code: app Con nên là tab, sidebar, hay vẫn một trang
nhưng có mục lục dính trên. Nhớ ràng buộc: giám khảo xem 90 giây, và ba mẹ
60+ không tìm được thứ nằm sau hai lớp bấm.

### 1.3 Trải nghiệm — có mượt không

- Đếm số chạm cho ba việc hay làm nhất: xác nhận đã uống thuốc, hỏi Cháu Bi,
  xem hôm nay uống gì.
- Chỗ nào đang chờ mạng mà không nói gì? (đã đặt timeout, nhưng chưa rà hết
  các trạng thái loading)
- Chữ đủ to chưa, vùng bấm đủ rộng chưa, ở màn hình nhỏ nhất.

### 1.4 Hình ảnh — nhất quán

Toàn bộ app đang dùng inline style, không có design token cho khoảng cách và
bo góc. Kết quả: `borderRadius` chạy từ 10 tới 32 tuỳ chỗ, `fontSize` có cả
12.5 lẫn 13.5 lẫn 14.5. Cần rà một lượt cho thống nhất — việc này ăn thẳng
vào điểm "wow trong 90 giây".

**Cấm trong phiên audit:** thêm tính năng mới. Ba hạng mục nộp bài vẫn trắng.

---

## 2. Trạng thái đã kiểm chứng

Kiểm 16/08 lúc cuối phiên, bằng lệnh thật, không chép từ tài liệu cũ.

| Hạng mục | Trạng thái | Kiểm bằng |
|---|---|---|
| Firebase Hosting | ✅ 200 | `curl` |
| Bundle live có bản mới | ✅ | grep `Be Vietnam Pro` + màn chọn danh tính trong bundle |
| Cloud Run | ✅ `airiser-api-00015-rkc` | `gcloud run services describe` |
| `/api/health` | ✅ model `gemini-3.6-flash` | `curl` |
| `/api/ai/speak` | ✅ tồn tại (401 = đòi đăng nhập) | `curl -X POST` |
| `/api/ai/classify-symptom` | ✅ tồn tại (401) | `curl -X POST` |
| `/api/household/me` | ✅ tồn tại (401) | `curl -X POST` |
| `GEMINI_TTS_MODEL` | ✅ `gemini-3.1-flash-tts-preview` | `gcloud` |
| `GEMINI_TTS_VOICE` | ✅ `Leda` | `gcloud` |
| `npm run test:safety` | ✅ **64/64** | chạy tại máy |
| `npm run build` | ✅ sạch | chạy tại máy |
| Cây git | ✅ sạch, đã push | `git status` |

**Backend và frontend đều đã deploy bản mới nhất.** Không cần deploy lại
trước khi audit.

Project đúng là `ai-riser-namdosan-fa737` (number 208738321664). Project
`ai-riser-namdosan` (549420265836) là rác, trống. Kiểm `gcloud config get
project` trước mọi lần deploy.

---

## 3. Bốn hạng mục nộp bài

| Hạng mục | Bắt buộc | Trạng thái |
|---|---|---|
| AI Studio project link (Share → Public) | ✅ | ❌ **chưa làm** |
| Video YouTube ≤ 2 phút | ✅ | ❌ **chưa quay** — kịch bản ở [45](45-Video-Script.md) |
| Bài LinkedIn công khai | ✅ | ❌ **chưa viết** |
| Deployed link | ⭕ +10đ | ✅ đã có |

**Ba hạng mục bắt buộc vẫn trắng sau hai phiên.** Đây vẫn là rủi ro lớn nhất
của dự án, lớn hơn mọi lỗi kỹ thuật còn lại. Audit xong phải quay video ngay.

Còn treo: **asset 3D cho hook và đoạn đóng video**, theo bảng màu trong
[45](45-Video-Script.md). Chưa ai làm.

Import GitHub vào AI Studio **để cuối cùng** — AI Studio là bản sao tại một
thời điểm, không tự đồng bộ.

---

## 4. Đã làm trong phiên 16/08

Năm commit, từ `ce84a94` tới `2b278c7`.

### An toàn y tế

**Tab "Hỏi cháu" bỏ rơi mọi tín hiệu an toàn.** Ô hỏi nhanh chỉ lấy
`res.text`, vứt `isEmergency` / `startIntake` / `quickReplies`. Bác gõ "bác
chóng mặt" thì app hứa "để con hỏi bác vài câu" rồi **im luôn**; gõ "đau
ngực khó thở" thì cảnh báo hiện ra mà **không có nút gọi 115**. Giờ mọi câu
chạm sức khoẻ chuyển sang trợ lý đầy đủ kèm nguyên câu.

**Hai lỗi bịa dữ liệu ở backend.** `/ai/extract-prescription` khi Gemini lỗi
trả về đơn thuốc **bịa hoàn toàn** (Amlodipine 5mg, Paracetamol 500mg, bác
sĩ "TS.BS Nguyễn Văn An", còn 18 viên). `/ai/read-device` trả 128/82 mạch
74. Cả hai có cờ `is_fallback` mà **không chỗ nào phía frontend đọc** — đã
grep cả repo. Mạng chập lúc bác chụp đơn là app nhắc uống thuốc bác chưa
từng được kê; chỉ số bịa thì chạy vào `evaluateVital` rồi ra "trong ngưỡng
bình thường" cho người có thể đang 180/110. Cả hai giờ trả lỗi thật.

**Ba lỗi khớp chuỗi con trong từ điển triệu chứng.** `classifyUtterance`
dùng `includes()` thô:
- `"đau đầu gối"` chứa `"đau đầu"` → té đau **gối** bị đọc thành té **đập
  đầu** và đẩy lên 115. Đây đúng là ca demo trong [46](46-Demo-Materials.md).
- `"rồi"` chứa `"oi"` (ói), `"rất"` bỏ dấu thành `"rat"` (rát) → câu tiếng
  Việt bình thường rơi vào bộ hỏi triệu chứng.

Giờ khớp theo **từ**, cộng guard cho `"đau đầu"` + bộ phận cơ thể. Hai token
`rat`/`oi` bỏ hẳn vì sau khi bỏ dấu chúng là cùng một từ, không vá được.

### Gemini vào luồng triệu chứng

`/ai/classify-symptom` — model **chỉ điền nhãn vào khung có sẵn**, không trả
lời, không quyết định. Bảng luật tĩnh vẫn giữ toàn bộ kết luận 115 / khám
24h. Ba luật chặn ở `classifyUtteranceSmart`:

1. Gemini đẩy mức nặng **lên** — tự do.
2. Chỉ được **hạ một nấc** `NEEDS_INTAKE → NOT_SYMPTOM`, cần confidence ≥ 0.8.
3. Từ điển đã bắt cụm cấp cứu hoặc chấn thương → **khoá cứng**.

Mạng hỏng → giữ nguyên kết quả từ điển. Khung Gemini điền chỉ dùng để **bỏ
bớt câu hỏi đã rõ**, không chạy thẳng bảng luật. Bước "kèm theo" **không bao
giờ** bỏ qua — nó chứa gần hết red flag.

### Danh tính trong nhà

`members/{uid}` (tài khoản) và `subjects/{sid}` (người có hồ sơ) trước đây
**không nối với nhau bằng gì**, nên app Ba Mẹ đoán bằng `subjects[0]`. Máy
thứ hai nhập mã mời là lập tức **trở thành người đầu danh sách** — mọi liều
thuốc họ xác nhận đều ghi vào hồ sơ người khác.

Thêm `members/{uid}.subject_id` ghi qua `POST /household/me`. Đi backend vì
rules để `members` chỉ-đọc với client. **Không sửa `firestore.rules` dòng nào.**

Kèm `IdentityPickerView`, `HouseholdManageModal` (hai danh sách tách bạch:
hồ sơ vs máy đang dùng chung), và `signOutFully()` — trước đó cách duy nhất
để thử lại luồng người mới là xoá app khỏi màn hình chính rồi cài lại.

### Xưng hô

App phục vụ cả nhà, không riêng ba mẹ. Câu chữ viết bằng thẻ (`{{Me}}`,
`{{You}}`, `{{a}}`, `{{nha}}`, `{{Da}}`), thay lúc hiển thị theo hồ sơ. Hai
register: `con–bác` và `mình–bạn`. Chọn tay trong AddSubjectModal, mặc định
suy từ năm sinh, không biết thì lễ phép.

Tên "Cháu Bi" **không đổi** — đó là tên riêng, không phải đại từ.

### Giọng đọc

`/ai/speak` qua Gemini TTS, có chỉ dẫn diễn đạt và đệm theo nội dung. Hỏng /
hết quota / model không có → **tự rơi về `speechSynthesis` của trình duyệt**,
không báo lỗi ra màn hình. Câu bảo gọi 115 không bao giờ được câm.

### Giao diện

- **Font tiếng Việt vỡ.** `Outfit` chỉ có subset `latin` + `latin-ext`; dải
  U+1EA0–U+1EF1 (ạ ế ộ ố ờ ứ ừ ự…) **không có trong font**, nên tiêu đề rớt
  sang font hệ thống giữa chừng một từ. Đổi sang **Be Vietnam Pro**. Đã kiểm
  trên trình duyệt: face vietnamese đã tải, không còn face Outfit.
- **Màn hình nói riêng** (`VoiceCaptureView`): che kín, vòng tròn 176px đang
  đập, chữ hiện dần theo lời nói. Nút micro nhỏ với viền đổi màu không đủ thấy.
- **Bộ hỏi ngắn lại**: bỏ qua bước Gemini đã rút được từ câu nói, kèm khối
  "Con hiểu từ lời bác vừa nói: …" bấm sửa được. "Không có gì kèm theo"
  chuyển lên đầu danh sách.
- Bỏ khối "Mã nhà (Mời con cái vào xem)" — nó in `selectedMember.id`, một id
  nội bộ không mời được ai, mà vẫn lọt khung hình khi quay.
- `UserProfileModal` mặc định số khẩn cấp `0908 123 456` — số bịa, bấm Lưu
  là ghi thật. Đã để trống.

### Hạ tầng

- `apiPost` trước đây **không có timeout nào**. Giờ: `/ai/speak` 3.5s,
  `/ai/classify-symptom` 4s, còn lại 25s.
- Hạn mức nâng 60 → **150** lượt/người/ngày: một câu hỏi giờ tốn 3 lượt
  (classify + ask + speak).

---

## 5. ⚠️ Chưa ai bấm thử bằng tay

**Đây là mục quan trọng nhất của tài liệu này.** Phần lớn việc phiên 16/08
mới chỉ qua `build` + `test:safety` + đọc code. Những thứ sau **chưa từng
chạy thật một lần nào**:

- [ ] Màn hình nói (`VoiceCaptureView`) — trên cả Android lẫn iOS
- [ ] Giọng Gemini TTS có thật sự phát ra tiếng không, và nghe thế nào
- [ ] `/ai/classify-symptom` phân loại đúng tới đâu trên câu nói thật
- [ ] Luồng chọn "tôi là ai" khi máy thứ hai nhập mã mời
- [ ] `HouseholdManageModal` — danh sách máy có hiện đúng không
- [ ] Đăng xuất rồi vào lại bằng mã mới
- [ ] Bộ hỏi rút gọn — có thật sự bỏ qua đúng bước không
- [ ] Xưng hô `mình–bạn` khi khai một hồ sơ dưới 60 tuổi
- [ ] Quét đơn thuốc khi Gemini lỗi — phải báo lỗi, không bịa

Lý do chưa thử: dựng lại các trạng thái này cần ghi dữ liệu thật vào
Firestore production. **Phiên sau làm việc này trước tiên.**

Cách đo giọng đọc có chạy không:

```bash
gcloud run services logs read airiser-api --region asia-southeast1 --project ai-riser-namdosan-fa737 --limit 30
```

Có dòng `TTS: máy chủ từ chối` hoặc `TTS: phản hồi không có audio` → đang
dùng giọng trình duyệt. Không có dòng nào mà vẫn nghe đơ → mở Console trình
duyệt tìm `[speech] dùng giọng trình duyệt:` kèm mã lỗi.

---

## 6. Đang chặn đường — chỉ chủ dự án làm được

Console, không phải code:

- [ ] Thêm **Test users** vào OAuth consent screen
- [ ] Đặt **budget alert** trên Cloud Billing — Blaze đang bật, vượt quota là
      mất tiền thật, mà hạn mức vừa nâng 60 → 150
- [ ] Giới hạn **HTTP referrer** cho các khoá API
- [ ] `DEMO_PASSWORD` đang là `12345678`, mà tên đăng nhập demo thì công khai
      qua `apiGet`. Rủi ro thấp (mỗi tài khoản một nhà riêng, không dữ liệu
      thật) nhưng đổi chỉ tốn một lệnh

Cả hai scope `calendar.events` và `tasks` **đã khai** và cả hai API **đã
bật**. Kiểm 16/08, đừng làm lại.

---

## 7. Bẫy đã gặp — đừng đạp lại

| Bẫy | Ghi nhớ |
|---|---|
| Deploy nhầm project | `gcloud config` từng trỏ `ai-riser-namdosan`. Luôn kiểm trước |
| Thứ tự deploy | **backend → frontend → rules**. Rules mới chặn frontend cũ |
| Route sống hay chết | Gọi thẳng URL Cloud Run ra 404 vì route mount dưới `/api/*`. Test qua domain Hosting |
| `createCustomToken` | Cần `roles/iam.serviceAccountTokenCreator` cho `api-runtime` **trên chính nó** |
| Overpass API | Trả **406** cho User-Agent mặc định của Node |
| Import trong `src/services` | Nhiều chỗ thiếu đuôi `.js` → chạy qua Vite được, `node` thuần thì không. Dùng `npx vite-node` |
| Font Google | Có tên trong danh sách **không** đảm bảo có subset vietnamese. Kiểm bằng cách tải CSS về xem có khối `/* vietnamese */` |
| Model có trong list ≠ dùng được | `models?key=` liệt kê ra không có nghĩa là khoá được phép sinh audio |
| Đơn thuốc demo | Phải quét vào hồ sơ **Ba Mười** mới ra cảnh báo tương tác |
| Google Maps Platform | Không dùng được ở VN. **Không dùng VPN để lách** |

---

## 8. Quyết định đã chốt — đừng lật lại nếu không có lý do mới

**Không cho LLM ra quyết định an toàn.** Đã bị đề nghị nhiều lần, và phiên
16/08 đã mở đúng một cửa: Gemini **hiểu câu nói**, luật cứng **giữ kết
luận**. Ranh giới không nằm ở "có dùng AI không" mà ở "ai ký tên vào kết
luận có đi khám hay không". Ca té ngã là bằng chứng: model biết đúng statin
gây đau cơ, nhưng gán kiến thức đúng đó vào một ca chấn thương rồi khuyên
chườm ấm.

**Không bỏ bước "kèm theo" trong bộ hỏi.** Bộ hỏi đã rút ngắn hết mức an
toàn. Bước này chứa gần hết red flag; Gemini không nhắc tới không có nghĩa
là không có.

**Không dựng dữ liệu dự phòng khi AI lỗi.** Hỏng thì báo hỏng. Đã dọn hai ổ
trong phiên này, đừng để mọc lại vì "cho demo mượt".

**Không thêm đăng nhập email/mật khẩu.** Sign in with Google đã chạy; `/demo`
phục vụ người chấm.

**Không dựng tài khoản Gmail chia sẻ cho giám khảo.** Google chặn thiết bị lạ.

**Play Store là mục tiêu sau deadline.** Luật closed testing 12 tester × 14
ngày không kịp, và **không cộng thêm điểm** — deployed link +10đ đã có.

---

## 9. Tài liệu cần đọc

| Doc | Nội dung |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | Nguyên tắc làm việc, ranh giới y tế, ràng buộc cứng |
| [44](44-AI-Studio-Instructions.md) | Instruction dán vào AI Studio |
| [45](45-Video-Script.md) | Kịch bản video 90 giây theo mốc giây |
| [46](46-Demo-Materials.md) | Đơn thuốc mẫu, câu hỏi để gõ, thứ tự 10 bước quay |
| [47](47-Handoff.md) | Mục 6 vẫn đáng đọc (lý do các quyết định). Phần trạng thái đã lỗi thời |
| ~~43~~ | **Lỗi thời, có tuyên bố sai. Không dùng.** |

---

## 10. Lệnh hay dùng

```bash
npm run test:safety                    # 64 test ranh giới y tế — phải xanh trước mọi lần deploy
npm run build
npm run deploy                         # Firebase Hosting
npx vite-node <file.mjs>               # chạy script có import từ src/
```

Deploy backend:

```bash
gcloud run deploy airiser-api --source server --region asia-southeast1 --project ai-riser-namdosan-fa737
```

Kiểm route còn sống (401 = sống và đòi đăng nhập, 404 = chưa deploy):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{}' https://ai-riser-namdosan-fa737.web.app/api/ai/speak
```
