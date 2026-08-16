# 47 — Handoff (bản mới nhất, 16/08/2026)

> ⚠️ Tài liệu này **thay thế** [43](43-Handoff-Submission-Checklist.md).
> Doc 43 có nhiều tuyên bố sai: nói app "hoàn thành 100%", nói có fallback
> OpenStreetMap (lúc đó chưa có), nói backend proxy cho tìm nhà thuốc (proxy
> tồn tại nhưng không ai gọi). Đừng tin số liệu trong đó.
>
> Còn **14 ngày** tới hạn nộp 23:59 30/08/2026.

---

## 1. Trạng thái đã kiểm chứng

Kiểm tra lúc 16/08/2026, không phải chép lại từ tài liệu cũ.

| Hạng mục | Trạng thái |
|---|---|
| Firebase Hosting | ✅ 200 · https://ai-riser-namdosan-fa737.web.app |
| Backend Cloud Run | ✅ `airiser-api-00008-577`, region `asia-southeast1` |
| `/api/health` | ✅ model `gemini-3.6-flash` |
| `npm run test:safety` | ✅ **40/40** |
| `npm run build` | ✅ sạch |
| GitHub | ✅ `jak3rpham/ai-riser-namdosan`, public, đã push hết |

**Project đúng là `ai-riser-namdosan-fa737`** (project number 208738321664).
Có một project khác tên `ai-riser-namdosan` (549420265836) tạo hồi đầu — **trống,
không dùng**. Đã có lần deploy nhầm sang đó. Kiểm tra `gcloud config get project`
trước khi deploy.

---

## 2. Bốn hạng mục nộp bài

| Hạng mục | Bắt buộc | Trạng thái |
|---|---|---|
| AI Studio project link (Share → Public) | ✅ | ❌ **chưa làm** |
| Video YouTube ≤ 2 phút | ✅ | ❌ **chưa quay** — kịch bản xong ở [45](45-Video-Script.md) |
| Bài LinkedIn công khai | ✅ | ❌ **chưa viết** |
| Deployed link | ⭕ +10đ | ✅ đã có (Firebase Hosting) |

**Ba hạng mục bắt buộc vẫn chưa có gì.** Đây là rủi ro lớn nhất của dự án lúc này,
lớn hơn mọi lỗi kỹ thuật còn lại.

Thứ tự đề nghị: sửa xong chặn đường ở mục 5 → quay video → viết LinkedIn →
**import GitHub vào AI Studio cuối cùng** (import sớm thì giám khảo đọc bản cũ,
vì AI Studio là bản sao tại một thời điểm, không tự đồng bộ).

---

## 3. Đã làm trong phiên 15–16/08

### Bảo mật

**Mã mời không còn là id nhà.** Trước đây rules cho bất kỳ ai đã đăng nhập (kể cả
ẩn danh) tự ghi mình vào `members/{uid}` — biết id nhà = toàn quyền đọc và **ghi**
hồ sơ y tế, vĩnh viễn. Mà id đó hiện thẳng trên màn hình dưới nhãn "Mã mời người
nhà", chỉ cần lọt vào một khung hình video là mất.

Giờ mã mời là vật riêng: hết hạn 7 ngày, tối đa 5 lượt, thu hồi được, 8 ký tự bỏ
0/O/1/I/L. Kết nạp thành viên do backend làm bằng transaction (rules không đếm
lượt an toàn được). Client mất hẳn quyền ghi `members`.
→ `server/src/routes/household.js`, `firestore.rules`

**Tài khoản dùng thử dạng tên đăng nhập** ở đường riêng `/demo`, không có liên kết
nào từ app chính. Backend cấp Firebase custom token. Không phát tài khoản Gmail vì
giám khảo sẽ bị Google chặn thiết bị lạ rồi đòi mã xác minh gửi về máy chủ tài khoản.
→ `server/src/routes/demo.js`, `src/components/DemoLoginView.jsx`

Tên: `giamkhao1`…`giamkhao5`, `dungthu`. Mật khẩu ở env `DEMO_PASSWORD` trên Cloud
Run. Mỗi tên một nhà riêng, không đụng dữ liệu nhau.

### An toàn y tế — bốn lỗi bịa số liệu

Tất cả cùng một dạng: **số bịa ghi cứng trong component**, nên rơi vào cả nhà thật.

1. Chỉ số huyết áp 125/82, đường huyết 5.8, cân nặng 64.5 hiện cho **mọi** người
   được chăm sóc. Khai báo mẹ thật vào app là thấy ngay "huyết áp của mẹ" mà
   không ai đo. Kèm theo: chỉ số nằm trong `useState`, tải lại trang là mất —
   tính năng theo dõi huyết áp thực chất chưa từng hoạt động.
2. Tỷ lệ tuân thủ rơi về hằng số **96%** + "uống rất đúng giờ" cho hồ sơ chưa
   uống viên nào.
3. Tủ thuốc: `Infinity` lọt vào nhánh "Đủ điều trị / Lượng thuốc còn đầy đủ" khi
   trong tủ không có gì.
4. Một lịch tái khám bịa, kèm chỉ dẫn **"Nhịn ăn sáng trước 07:00 để lấy máu"** —
   bác đọc được là nhịn ăn thật, cho một cuộc hẹn không tồn tại.

### An toàn y tế — ca té ngã

Bác nói *"Bác mới bị té, đau đầu gối quá"*. App bỏ qua chữ "té", chạy bộ hỏi đau
khớp thường, rồi kết luận đau khớp là *"tác dụng phụ thường gặp của thuốc mỡ máu"*
và khuyên **chườm ấm**. Một cái gối vừa bị té có thể đang nứt xương.

Gốc rễ ở hai chỗ, chỗ thứ hai đáng sợ hơn:
- `symptomTriage` không có bất kỳ từ nào về té/ngã.
- `narrateSymptomPrompt` **chủ động mời** model làm cả hai việc sai: yêu cầu "một
  việc làm được ngay để dễ chịu hơn" và cho phép nhắc tác dụng phụ của thuốc
  trong hồ sơ. Model làm đúng thứ nó được bảo.

Đã thêm nhánh `TRAUMA`, xét **trước** từ điển triệu chứng, trả lời cố định không
qua model. Té thường → khám trong 24h. Té kèm đập đầu/chảy máu/không đứng dậy
được → 115. Lời khuyên dặn **đừng** tự xoa bóp hay chườm.
Prompt cấm hẳn: gán triệu chứng cho thuốc, khuyên chườm/xoa/băng/kê cao, khuyên
uống thêm bất cứ thứ gì.

### Nhãn nói sai sự thật

- `"Google Places API (Thật)"` → đã đổi thành `"Dữ liệu OpenStreetMap"`. Chữ
  "(Thật)" in ra màn hình trong khi backend đã chuyển sang OSM.
- `"Gemini 1.5 Vision"` → `"Gemini Vision"`; backend chạy `gemini-3.6-flash`.

### Sản phẩm

- **Đổi tên app** thành **"Nhà Mình"** (tên nhóm gia đình của chủ dự án). Trước
  đó manifest ghi "An Nhà" còn UI ghi "Sức Khỏe Nhà".
- **Luồng setup thật**: trước đây ai mở app cũng bị tự tạo nhà rồi nhồi sẵn hồ sơ
  "Ba Mười", "Mẹ Lan". Giờ onboarding hai lối vào: tạo nhà / nhập mã mời. Kèm
  `AddSubjectModal` khai báo người được chăm sóc, `EmptyHouseholdView` cho nhà trống.
- **Thoát khỏi ngõ cụt**: đổi tài khoản Google trên cùng máy từng kẹt cứng ở màn
  hình đỏ. Hook giờ kiểm tra tư cách thành viên rồi tự quên id cũ.
- **Bỏ Google Places → OpenStreetMap/Overpass**. Google chặn billing account đăng
  ký bằng thẻ/giấy tờ Việt Nam nên Places API không bao giờ bật được từ project
  VN. Đã test thật: 15 kết quả quanh Q1 TP.HCM.
- **Ẩn bảng dev** khỏi bản live (`?dev=1` để bật lại), sửa tràn khung thanh tiêu đề.
- **Icon PWA**: `manifest.json` từng trỏ vào `favicon.svg` không tồn tại.
  → `scripts/make_icons.py` sinh lại toàn bộ.
- **Nút kiểm tra Calendar** báo "chưa cấp đủ quyền" dù quyền đã đủ: nó gọi
  `/users/me/calendarList`, endpoint đòi scope rộng hơn `calendar.events` mà app
  xin. Đã đổi sang đọc sự kiện lịch chính. Không nới scope.

---

## 4. Bẫy đã gặp — đừng đạp lại

| Bẫy | Ghi nhớ |
|---|---|
| Deploy nhầm project | `gcloud config` từng trỏ `ai-riser-namdosan`. Luôn kiểm tra trước khi deploy |
| Thứ tự deploy | **backend → frontend → rules**. Rules mới chặn frontend cũ |
| `createCustomToken` | Cần `roles/iam.serviceAccountTokenCreator` cho `api-runtime` **trên chính nó**. Đã cấp |
| Overpass API | Trả **406** cho User-Agent mặc định của Node. Phải gửi UA định danh app |
| Import trong `src/services` | Nhiều chỗ thiếu đuôi `.js` → chạy được qua Vite, **không** chạy bằng `node` thuần. Dùng `npx vite-node` |
| Đơn thuốc demo | Phải quét vào hồ sơ **Ba Mười** mới ra cảnh báo tương tác. Mẹ Lan không uống statin |
| Google Maps Platform | Không dùng được ở VN. **Không dùng VPN để lách** — vi phạm ToS, rủi ro khoá tài khoản đang giữ cả bài thi lẫn Play Console |

---

## 5. Đang chặn đường

**Việc chỉ chủ dự án làm được (Console, không phải code):**

- [ ] Thử lại nút **Kiểm tra Calendar** sau bản sửa mới nhất — phải ra xanh
- [ ] Thêm **Test users** vào OAuth consent screen (mail của mình, ba mẹ, người test)
- [ ] Đặt **budget alert** trên Cloud Billing — đã bật Blaze nên vượt quota là mất tiền thật
- [ ] Giới hạn **HTTP referrer** cho các khoá API
- [ ] (tuỳ chọn, chạy nền) Nộp hồ sơ **OAuth verification** — không kịp trước 30/08
  nhưng cần cho Play Store sau này

Cả hai scope `calendar.events` và `tasks` **đã khai** trong consent screen, và cả
hai API **đã bật**. Đã kiểm tra 16/08, đừng làm lại.

**Việc code còn tồn:**

- [ ] Bỏ chip gợi ý cố định trong màn "Hỏi cháu", đổi sang ô nhập tự do. Chip
      hiện y hệt nhau cho mọi người, không liên quan tới điều bác vừa nói.
      **Giữ nguyên lớp phân loại cứng bên dưới** — xem mục 6.
- [ ] Asset 3D cho hook và đoạn đóng video, theo bảng màu trong [45](45-Video-Script.md)

---

## 6. Quyết định đã chốt — đừng lật lại nếu không có lý do mới

**Không cho LLM trả lời thuần cho triệu chứng.** Đã bị đề nghị nhiều lần. Ca té
ngã là bằng chứng: model **có** kiến thức y khoa đúng (statin gây đau cơ là sự
thật), nhưng suy luận sai khi gán nó vào một ca chấn thương. Knowledge base mạnh
hơn sửa được lỗi *nhớ sai*, không sửa được lỗi *suy luận sai* — mà càng mạnh thì
câu sai càng nghe có lý.

Phân vai: AI hiểu câu nói, giải thích thuốc **có trong hồ sơ**, diễn đạt ấm áp.
Luật cứng giữ mọi kết luận ảnh hưởng tới việc **có đi khám hay không**. Triệu
chứng ngoài danh sách → nói thật là chưa đủ chắc rồi kéo người nhà vào.

**Không thêm đăng nhập email/mật khẩu.** Sign in with Google đã chạy; tài khoản
dùng thử `/demo` phục vụ người chấm. Thêm hệ thống mật khẩu là thêm bề mặt tấn
công và không cộng điểm nào.

**Không dựng tài khoản Gmail chia sẻ cho giám khảo.** Google chặn thiết bị lạ,
đòi mã xác minh gửi về máy chủ tài khoản. Giám khảo sẽ kẹt.

**Play Store là mục tiêu sau deadline.** Tài khoản cá nhân bị luật closed testing
12 tester × 14 ngày liên tục. Không kịp trước 30/08, và **không cộng thêm điểm**
— deployed link +10đ đã có từ Firebase Hosting rồi.

---

## 7. Tài liệu cần đọc

| Doc | Nội dung |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | Nguyên tắc làm việc, ranh giới y tế, ràng buộc cứng |
| [44](44-AI-Studio-Instructions.md) | Instruction dán vào AI Studio + up file gì + prompt cấm-sửa khi import |
| [45](45-Video-Script.md) | Kịch bản video 90 giây theo mốc giây |
| [46](46-Demo-Materials.md) | Đơn thuốc mẫu, câu hỏi để gõ, thứ tự 10 bước quay |
| [36](36-Google-Integration.md) | Tích hợp Google (lưu ý: R17 về Starter Tier đã hết hiệu lực, billing đã bật) |
| ~~43~~ | **Lỗi thời, có tuyên bố sai. Không dùng.** |

---

## 8. Lệnh hay dùng

```bash
npm run test:safety                    # 40 test ranh giới y tế — phải xanh trước mọi lần deploy
npm run build
npm run deploy                         # Firebase Hosting, dùng token gcloud sẵn có
python3 scripts/make_icons.py          # sinh lại bộ icon PWA
npx vite-node <file.mjs>               # chạy script có import từ src/
```

Deploy backend:

```bash
gcloud run deploy airiser-api --source server --region asia-southeast1 --project ai-riser-namdosan-fa737
```
