# 50 — Handoff (16/08/2026, cuối phiên tối)

> Thay cho [48](48-Handoff.md). Mục 1 và mục 6 của 48 đã xong hoặc đã lỗi thời.
> Doc [49](49-Kich-Ban-Quay-Man-Hinh.md) là kịch bản quay, vẫn dùng nguyên.
>
> Còn **14 ngày** tới hạn nộp 23:59 30/08/2026.

---

## 1. Việc của phiên sau — theo đúng thứ tự

### 1.1 Kiểm hai bản sửa đăng nhập Google *(chưa ai chạy thử)*

Đây là việc đầu tiên, và là việc gấp nhất. Hai lỗi khoá-nhà đã sửa nhưng
**chưa bấm thử lần nào** vì OAuth cần popup và tài khoản Google thật:

1. Tạo nhà mới → khai một hồ sơ
2. **Kết nối Google** → duyệt quyền → phải vào thẳng dashboard
3. **Ngắt kết nối Google** → phải VẪN ở trong nhà, chỉ mất phần đồng bộ lịch
4. Kết nối lại lần nữa

Rớt ra màn đỏ ở bước nào = còn một đường nữa làm đổi uid. Màn đỏ giờ có nút
"Bắt đầu lại" nên không kẹt, và nó hiện mã nhà để còn khôi phục.

### 1.2 Ba hạng mục nộp bài — vẫn trắng sau bốn phiên

| Hạng mục | Trạng thái |
|---|---|
| AI Studio project link (Share → Public) | ❌ chưa làm — hướng dẫn ở [44](44-AI-Studio-Instructions.md) |
| Video YouTube ≤ 2 phút | ❌ chưa quay — kịch bản [45](45-Video-Script.md) + [49](49-Kich-Ban-Quay-Man-Hinh.md) |
| Bài LinkedIn công khai | ❌ chưa viết |
| Deployed link | ✅ đã có |

**Đây là rủi ro lớn nhất của dự án, lớn hơn mọi lỗi kỹ thuật còn lại.** App đã
ở trạng thái quay được. Import GitHub vào AI Studio để **cuối cùng** — nó là
bản sao tại một thời điểm, không tự đồng bộ.

### 1.3 Tập dượt bốn cảnh quay chưa chắc chạy

Xem [49](49-Kich-Ban-Quay-Man-Hinh.md) mục 3. Bốn cảnh ⚠️ phụ thuộc dịch vụ
ngoài, hỏng lúc quay là mất cả buổi.

---

## 2. Trạng thái đã kiểm chứng

Kiểm 16/08 lúc cuối phiên bằng lệnh thật.

| Hạng mục | Trạng thái | Kiểm bằng |
|---|---|---|
| Cây git | ✅ sạch, HEAD `5ad950f` | `git status` |
| `npm run test:safety` | ✅ **64/64** | chạy tại máy |
| `npm run build` | ✅ sạch | chạy tại máy |
| Cloud Run | ✅ `airiser-api-00019-rjl` | `gcloud run services describe` |
| Bundle live khớp bản build | ✅ `index-kZO0E6Vd.js` | `curl` + `ls dist` |
| `/api/health` | ✅ model `gemini-3.6-flash` | `curl` |
| Khoá Gemini | ✅ `ai.last_call_ok: true` | `/api/health` |

**Backend và frontend đều đã lên bản mới nhất.**

---

## 3. Đã làm trong phiên 16/08 (tối)

Mười bốn commit, từ `65180d5` tới `5ad950f`.

### Nhóm nặng nhất — app nói nó đã làm việc nó không làm

- **Màn quét đơn thuốc** vứt kết quả lưu rồi luôn báo "Đã lưu đơn thuốc".
  Firestore từ chối thì đơn biến mất mà người nhà tưởng xong.
- **Nhánh triệu chứng nhẹ** không ghi gì, trong khi cả câu dự phòng lẫn prompt
  server đều nói "đã báo cho người nhà". Giờ ghi thật, loại `SYMPTOM_LOG`.
- **Bốn chấm cữ** trong ngày là màu viết cứng: cữ Sáng LUÔN xanh. Bác mở app
  8 giờ tối chưa uống viên nào vẫn thấy app khẳng định sáng đã uống.
- **Panel Kết nối** khẳng định "trợ lý Cháu Bi hoạt động" trong khi khoá đang
  bị Google trả 401 và mọi `/ai/*` trả 502.

### Hai lỗi khoá người dùng ra khỏi nhà của chính họ

- **Nối Google** dùng `signInWithPopup` → thay thế uid ẩn danh → mất tư cách
  thành viên. Sửa bằng `linkWithPopup`.
- **Ngắt kết nối Google** gọi `signOut` → uid mới → khoá lần nữa. Sửa: chỉ xoá
  token, không đụng phiên.

### Ba lỗi im lặng, không ai thấy cho tới khi bấm thử

- `/ai/classify-symptom` trả **BAD_JSON cho mọi lời gọi** từ lúc viết, vì
  `maxOutputTokens: 200` bị phần suy nghĩ của model ăn hết. Client bắt lỗi rồi
  lặng lẽ dùng từ điển tại máy nên nhìn ngoài app vẫn chạy.
- **Đường `/demo`** — lối vào duy nhất của giám khảo — đăng nhập xong ra màn
  onboarding trống trơn, vì `ensureUser()` ghim phiên ẩn danh.
- **Bấm hai lần là ghi hai liều thuốc.** Bản sửa đầu dùng `useState` và bài
  kiểm bác bỏ nó: bấm 3 lần vẫn ghi đủ 3 liều. Phải là `useRef`.

### Điều hướng và trình bày

Thanh bên sáu mục cho app Con (trục 1.2 của doc 48). Thang kích thước: 19 bo
góc → 7, 28 cỡ chữ → 11. Chữ chở thông tin y tế trong app Ba Mẹ nâng lên 16px.
Bỏ icon đúp và mã nội bộ (M12/M16/M17) khỏi chữ hiện ra.

### Vật liệu nộp bài

- `demo-assets/app-screens/` — 12 ảnh giao diện thật, 2x DPI, kèm README có
  bảng màu và thang chữ
- `demo-assets/video-assets/` — folder asset 16:9, mỗi asset một thư mục có
  sẵn prompt và ảnh kèm; 5 plate 16:9 đã ghép sẵn không cần AI
- [49](49-Kich-Ban-Quay-Man-Hinh.md) — kịch bản quay theo app mới

---

## 4. ✅ Đã bấm thử bằng tay trên dữ liệu thật

Khác hẳn doc 48 — phiên này dựng được nhà thật để thử, nhờ thêm proxy `/api`
vào `vite.config.js` (trước đó `npm run dev` không gọi được backend).

- Ghi số đo huyết áp 152/96 → lưu Firestore → vọng về đúng nhãn "Cao"
- Bấm "đã uống" → feed máy con cái hiện trong vài giây
- Bấm 5 lần liên tiếp → ghi đúng 1 dòng
- Gõ "bác thấy chóng mặt" → chuyển sang trợ lý đầy đủ + mở bộ hỏi
- Đi hết bộ hỏi nhánh nhẹ → dòng "GHI NHẬN" hiện trên máy con cái
- `/ai/classify-symptom` đúng cả 4 ca khó (té đau **gối** không còn thành đập
  **đầu**; "quên uống thuốc trưa rồi cháu ơi" ra NOT_SYMPTOM conf 1.0)
- `/ai/speak` trả WAV thật 4.04 giây, lần hai `cached: true`
- Quét đơn lúc AI chết → báo lỗi thật, **không bịa đơn thuốc**
- `/demo` với `giamkhao5` → vào thẳng nhà đã nạp sẵn
- Nhà thuốc gần đây → 15 kết quả OpenStreetMap thật
- Thanh bên đủ 6 mục, khổ 375px không trượt ngang, không nút nào dưới 44px

## 5. ⚠️ Vẫn chưa ai bấm thử

- **Nối / ngắt Google** (hai bản sửa mới nhất) — mục 1.1
- **Google Calendar / Tasks** đồng bộ thật
- **Quét đơn thuốc thật** — mới chỉ kiểm nhánh LỖI, chưa kiểm nhánh đọc được
- **Nhận diện giọng nói** tiếng Việt (speech-to-text)
- App Ba Mẹ trên **máy thật** iOS/Android

---

## 6. Đang chặn đường — chỉ chủ dự án làm được

- [ ] **Xoá nhà rác trong Firestore** trước khi nộp: hai nhà `ZZ TEST AUDIT`
      (`G3FqI3BkhOkpK1hFRQ4K`, `zTLtH6hfviaBnk5Ql2E1`), vài nhà tên `Nhà mình`
      do script chụp ảnh tạo, và nhà bị khoá do lỗi nối Google
- [ ] **Xoá các nhà `is_demo: true`** để tài khoản giám khảo nạp lại dữ liệu
      với ngày mới — `seedDemoData` chỉ chạy khi nhà còn trống
- [ ] Thêm **Test users** vào OAuth consent screen
- [ ] Giới hạn khoá Gemini theo **Generative Language API** (khoá nằm ở server
      nên referrer không chặn được)
- [x] Budget alert — chủ dự án báo đã làm
- [x] Đổi `DEMO_PASSWORD` — đã đổi (revision 00019). **Mật khẩu mới không nằm
      trong repo và Claude không giữ.** Ai cần chụp màn hình từ tài khoản demo
      thì phải xin.

---

## 7. Bẫy đã gặp — đừng đạp lại

| Bẫy | Ghi nhớ |
|---|---|
| Đổi tài khoản Firebase = mất nhà | Tư cách thành viên gắn theo `uid`. Mọi thao tác đổi uid (`signInWithPopup`, `signOut`, custom token) phải xét lại quyền vào nhà |
| `useState` không chặn được bấm đúp | Giá trị đổi quá muộn; các lần bấm trong cùng nhịp render đều lọt. Dùng `useRef` |
| `maxOutputTokens` tính cả phần suy nghĩ | Model biết suy nghĩ ăn hết ngân sách trước khi kịp viết JSON. Đừng để thấp cho route trả JSON |
| Tab giữ bundle cũ | Kiểm "vẫn hỏng" đầu tiên là do tab chưa nạp lại. Luôn xác nhận tên file bundle trước khi kết luận bản sửa không ăn |
| `networkidle` với Vite | HMR giữ websocket nên không bao giờ tới. Dùng `domcontentloaded` cho localhost |
| Playwright + hồ sơ mới | Mỗi context là uid ẩn danh mới → không mượn được nhà có sẵn. Phải tự dựng nhà trong phiên chụp |
| `behavior: 'smooth'` bị huỷ | Component render lại ngay sau đó là cuộn mượt chết giữa chừng. Cuộn tức thì |
| Ngày ghi cứng trong dữ liệu mẫu | Dữ liệu đứng yên còn ngày thì chạy. Tính lùi từ hôm nay |
| Deploy nhầm project | Luôn kiểm `gcloud config get project` |
| Thứ tự deploy | **backend → frontend → rules** |

---

## 8. Quyết định đã chốt — đừng lật lại nếu không có lý do mới

**Không cho LLM ra quyết định an toàn.** Phiên này có bằng chứng thực nghiệm:
khoá Gemini chết nhiều giờ, `/ai/*` trả 502 toàn bộ, mà từ điển tại máy vẫn
phân loại đúng "bác thấy chóng mặt" và bảng luật tĩnh vẫn ra kết luận. App
không bịa một chữ nào trong suốt thời gian đó.

**Không dựng dữ liệu dự phòng khi AI lỗi.** Đã kiểm bằng tay: quét đơn lúc AI
chết ra màn lỗi thật với hai lối thoát, không có đơn thuốc nào được dựng ra.

**Dữ liệu bệnh nhân hư cấu KHÔNG phải "mock data bị cấm".** Ràng buộc cấm giả
lập TÍCH HỢP. Bệnh nhân hư cấu ghi thật qua Firestore rules là hợp lệ — không
được đem hồ sơ y tế người thật ra làm demo. Xem đầu `demoFixtures.js`.

**Giữ nguyên các dòng nói về giới hạn.** "Chưa được dược sĩ rà", "kho kiến
thức còn hạn chế", "không phải lời khẳng định an toàn tuyệt đối". Với app y
tế, thành thật về giới hạn là điểm cộng — đừng cắt cho gọn khung hình.

**Không thêm tính năng mới khi ba hạng mục nộp bài còn trắng.**

---

## 9. Lệnh hay dùng

```bash
npm run test:safety     # 64 test ranh giới y tế — xanh trước mọi lần deploy
npm run build
npm run dev             # đã có proxy /api sang backend thật
npm run deploy          # Firebase Hosting
```

```bash
gcloud run deploy airiser-api --source server --region asia-southeast1 --project ai-riser-namdosan-fa737
```

Chụp lại ảnh giao diện và plate video:

```bash
node scripts/chup-giao-dien.mjs AI-Riser-Prep/demo-assets/app-screens
node scripts/dung-plate-video.mjs AI-Riser-Prep/demo-assets/app-screens AI-Riser-Prep/demo-assets/video-assets/_plate-16-9
```

---

## 10. Tài liệu cần đọc

| Doc | Nội dung |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | Nguyên tắc làm việc, ranh giới y tế, ràng buộc cứng |
| [44](44-AI-Studio-Instructions.md) | Instruction dán vào AI Studio |
| [45](45-Video-Script.md) | Lời thoại và cảnh 3D. **Mục "cảnh quay màn hình" đã lỗi thời** |
| [49](49-Kich-Ban-Quay-Man-Hinh.md) | Kịch bản quay màn hình theo app hiện tại |
| [46](46-Demo-Materials.md) | Đơn thuốc mẫu, câu hỏi để gõ |
| ~~43~~, ~~47~~, ~~48~~ | Lỗi thời. Doc 47 mục 6 vẫn đáng đọc (lý do các quyết định) |
