# 34 — Test trên iPhone

> App là web (Vite + React), nên chạy trên iPhone qua Safari. Không cần build app native.
> Ba cách, chọn theo việc đang cần làm.

---

## 0. Chọn cách nào

| Việc cần làm | Cách dùng | Vì sao |
|---|---|---|
| Xem giao diện, bấm thử, sửa code thấy đổi ngay | **Cách A — dev qua Wi-Fi** | Nhanh nhất, hot-reload |
| Test **nút mic / nói với Cháu Bi** | **Cách B — HTTPS local** | Safari chỉ cho dùng mic trong "secure context" |
| Đưa ba mẹ dùng thật, gửi link cho ban giám khảo | **Cách C — Firebase Hosting** | URL công khai, HTTPS thật, không cần cùng Wi-Fi |

---

## 1. Cách A — chạy dev, mở bằng Wi-Fi nhà

Máy Mac và iPhone phải **cùng một mạng Wi-Fi**.

```bash
npm run dev
```

Terminal sẽ in ra hai dòng, lấy dòng **Network**:

```
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.32:3000/     ← gõ địa chỉ này vào Safari trên iPhone
```

Nếu không thấy dòng Network, lấy IP bằng:

```bash
ipconfig getifaddr en0
```

**Sửa code là iPhone tự cập nhật** — không cần bấm lại gì.

### Cách A không làm được gì
- ❌ **Nút mic của Cháu Bi**. Safari chặn micro trên `http://` (không phải secure context). Bấm vào sẽ hiện thông báo "trình duyệt chưa hỗ trợ" — **nhập chữ vẫn chạy bình thường**.
- ❌ Đọc vị trí (nếu sau này làm tính năng tìm nhà thuốc gần nhất bằng GPS thật).
- ✅ Chụp ảnh đơn thuốc **vẫn chạy** — nút chụp dùng `<input type="file" capture>`, iOS mở camera trực tiếp, không cần HTTPS.

### Vào không được?
| Triệu chứng | Cách xử |
|---|---|
| Safari quay mãi không ra | macOS Firewall đang chặn. System Settings → Network → Firewall → tắt, hoặc cho phép Node nhận kết nối vào |
| iPhone không cùng mạng | Tắt 4G/5G trên iPhone để chắc chắn nó đang đi qua Wi-Fi |
| Wi-Fi có bật "Client Isolation" (hay gặp ở Wi-Fi chung cư/quán) | Dùng Cách C, hoặc phát hotspot từ iPhone rồi cho Mac nối vào |

---

## 2. Cách B — HTTPS local, để test mic

```bash
npm run dev:https
```

Mở `https://192.168.1.32:3000` trên iPhone (chú ý **https**).

Safari sẽ báo **"Kết nối này không riêng tư"** vì chứng chỉ tự ký. Đây là chuyện bình thường với chứng chỉ local:

> Nâng cao (Show Details) → **Truy cập trang web này** (Visit this website) → **Truy cập** (Visit)

Sau đó nút mic sẽ xin quyền micro như app thật.

### Lưu ý về giọng nói trên iOS

| Tính năng | Trạng thái trên iPhone |
|---|---|
| **Đọc to** (`speechSynthesis`) | Chạy được. Nhưng iOS **bắt buộc phải có thao tác chạm** trước lần đọc đầu tiên — bấm nút gửi rồi mới đọc thì ổn, tự động đọc khi mở màn là bị chặn |
| **Nhận diện giọng nói** (`webkitSpeechRecognition`) | Có trên Safari iOS từ 14.5, nhưng **không ổn định**: dễ tự ngắt, đôi khi im lặng không trả kết quả |
| Giọng đọc tiếng Việt | Phụ thuộc máy có cài giọng vi-VN chưa. Cài ở Cài đặt → Trợ năng → Nội dung được nói → Giọng nói → Tiếng Việt |

> ⚠️ **Việc cần làm trước demo:** test nhận diện giọng nói trên **đúng chiếc iPhone sẽ dùng để quay video**, với **giọng người lớn tuổi thật**. Đây chính là rủi ro R2 trong [27](27-Risk-Register.md), và phương án dự phòng đã có sẵn: ô nhập chữ luôn nằm cạnh nút mic.

---

## 3. Cách C — deploy lên Firebase Hosting

Cách này cho URL thật dạng `https://ai-riser-namdosan-fa737.web.app` — dùng để đưa ba mẹ test và nộp bài.

### Lần đầu

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

Cấu hình hosting đã có sẵn trong `firebase.json` (thư mục `dist`, SPA rewrite, cache header). Không cần chạy `firebase init`.

### Mỗi lần muốn cập nhật

```bash
npm run build && firebase deploy --only hosting
```

### Xem thử trước khi đưa lên bản chính

```bash
firebase hosting:channel:deploy thu-nghiem --expires 7d
```

Lệnh này tạo một URL tạm sống 7 ngày, không đụng tới bản chính — hợp lý khi muốn gửi cho người khác xem thử.

### ⚠️ Khoá API và biến môi trường

`VITE_GEMINI_API_KEY` được nhúng thẳng vào file JS khi build — **ai mở DevTools cũng đọc được**. Với bản demo dự thi thì chấp nhận được, nhưng phải:

- Đặt **hạn mức chi tiêu** cho khoá trong Google AI Studio ([24](24-Scale-Cost-Control.md))
- Giới hạn khoá theo **HTTP referrer** = đúng domain Firebase Hosting
- Không commit file `.env` lên git

Tạo file `.env` ở thư mục gốc:

```
VITE_GEMINI_API_KEY=khoa-cua-ban
VITE_FIREBASE_API_KEY=khoa-firebase
```

> Không có khoá Gemini thì app vẫn chạy: scan đơn sẽ báo lỗi và mời nhập tay, Cháu Bi trả lời được câu về lịch uống thuốc từ hồ sơ. App **không** bịa dữ liệu để lấp chỗ trống — xem [33](33-Medical-Safety-Audit.md) mục 4.

---

## 4. Thêm vào Màn hình chính (cho ba mẹ dùng)

Trên iPhone, mở link → nút Chia sẻ → **Thêm vào MH chính**.

`index.html` đã có sẵn các thẻ meta cần thiết (`apple-mobile-web-app-capable`, `theme-color`, `viewport-fit=cover`), nên khi mở từ màn hình chính app sẽ **chạy toàn màn hình, không có thanh địa chỉ Safari** — nhìn như app thật. Đây là cách nên dùng khi đưa cho ba mẹ.

### Chưa làm được (giới hạn của web trên iOS)
- ❌ **Thông báo đẩy khi app đóng.** iOS chỉ cho web push khi đã Thêm vào MH chính, và cấu hình khá phiền. Nhắc giờ uống thuốc hiện đang dựa vào Google Calendar ([06](06-Tich-hop-Google-Tech.md)) — đây là lý do việc đồng bộ Calendar quan trọng hơn nó có vẻ.
- ❌ Chạy nền, báo thức.

---

## 5. Đã sửa gì cho vừa màn hình điện thoại (12/08)

Trước hôm nay `src/index.css` **không có một `@media` nào** — app chỉ dùng được trên màn hình rộng. Đã thêm:

| Sửa | Chi tiết |
|---|---|
| Xếp dọc dưới 900px | `.split-view` và `.stat-grid` chuyển thành một cột |
| Bỏ "điện thoại trong điện thoại" | Dưới 640px, khung giả lập iPhone trong `ParentHomeView` giãn full màn hình — đó mới là cách nó thật sự được dùng |
| Hết trượt ngang | Grid dùng `minmax(0, 1fr)` thay vì `1fr`. `1fr` không co xuống dưới min-content nên khung điện thoại đẩy cả trang rộng ra 484px trên màn 375px, kéo lệch luôn mọi modal |
| Không bị phóng to khi bấm ô nhập | iOS Safari tự zoom khi ô nhập có cỡ chữ < 16px. Đã ép 16px trên mobile |
| Vùng chạm 44px | Tối thiểu theo hướng dẫn của Apple — quan trọng với người lớn tuổi |
| Chừa tai thỏ / thanh home | `env(safe-area-inset-*)` |
| **Thêm CSS cho `.btn-parent-action`** | Class này được `ParentHomeView` dùng nhưng **chưa bao giờ được định nghĩa** — nút "ĐÃ UỐNG RỒI", nút quan trọng nhất của giao diện người lớn tuổi, đang render kiểu mặc định trình duyệt |

---

## 6. Danh sách kiểm trên máy thật

Kiểm bằng iPhone thật, không chỉ bằng Responsive Mode trên máy tính.

**Giao diện**
- [ ] Không trượt ngang được ở bất kỳ màn nào
- [ ] Bấm vào ô nhập không làm trang nhảy/phóng to
- [ ] Nút "ĐÃ UỐNG RỒI" đủ to, bấm trúng bằng ngón cái
- [ ] Modal Cháu Bi và bộ hỏi triệu chứng cuộn được hết, không bị bàn phím che

**Luồng an toàn** (phần quan trọng nhất — xem [33](33-Medical-Safety-Audit.md))
- [ ] Hỏi "bác đau bụng trên, buồn nôn" → ra bộ hỏi cấu trúc, **không** trả lời tự do
- [ ] Chọn Bụng trên + Vã mồ hôi → ra màn đỏ 115, nút gọi bấm được và mở đúng trình quay số
- [ ] Chọn Khớp + nhẹ + không kèm gì → chỉ ghi nhận, **không** báo động
- [ ] Nói "hồi năm ngoái bác đau ngực chứ giờ hết rồi" → **không** bắn báo động
- [ ] Chụp một ảnh bất kỳ không phải đơn thuốc → app báo không đọc được, **không** hiện ra đơn thuốc nào

**Camera / giọng nói**
- [ ] Nút chụp đơn thuốc mở được camera (chạy cả trên http)
- [ ] Nút mic: chạy trên HTTPS, báo lỗi tử tế trên http
- [ ] Đọc to phát ra tiếng sau khi bấm nút

---

## 7. Chạy bộ test an toàn

```bash
npm run test:safety
```

33 ca kiểm tra bảng luật triệu chứng, ánh xạ biệt dược, dị ứng, trùng hoạt chất, tương tác và ngưỡng chỉ số. Chạy lại sau mỗi lần sửa bảng luật — đây chính là "bộ test cố tình gài" mà [31](31-Assistant-Conversations.md) mục 7 đặt ra.
