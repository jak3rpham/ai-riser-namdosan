# Nhà Mình

**Giúp cả nhà uống thuốc đúng giờ, đúng liều — và biết khi nào cần đi khám.**

Ứng dụng sức khoẻ gia đình cho người Việt cao tuổi. Con cái chụp đơn thuốc của ba mẹ,
app đọc đơn, dựng lịch uống thuốc, nhắc tới giờ, và báo cho con biết ba mẹ đã uống chưa.

🔗 **Dùng thử:** https://ai-riser-namdosan-fa737.web.app
📱 Cài lên điện thoại: mở link → "Thêm vào màn hình chính" (chạy như app thật, cả iPhone lẫn Android)

> Dự thi **AI Riser Vietnam 2026**.

---

## Vì sao làm app này

Người già ở VN thường uống 4–7 loại thuốc mỗi ngày, đơn viết tay hoặc in mờ, chia
nhiều cữ. Con cái đi làm xa không biết ba mẹ đã uống chưa. Các app nhắc thuốc hiện có
viết cho người trẻ: chữ nhỏ, nhiều bước, tiếng Anh lẫn lộn.

Hai giao diện, một codebase:

| App Con | App Ba Mẹ |
|---|---|
| Chụp đơn thuốc, kiểm tra tương tác | 4 tab: 💊 Hôm nay · 📦 Tủ thuốc · 🎙️ Hỏi cháu · 👤 Tôi |
| Theo dõi ba mẹ đã uống thuốc chưa | Nút to, chữ lớn, một màn hình một việc |
| Đồng bộ Google Calendar / Tasks | Hỏi trợ lý "Cháu Bi" bằng giọng nói |

Trợ lý tự xưng **"con"**, gọi người dùng là **"bác"** — giọng cháu nói với bác, không
phải bác sĩ đọc chỉ định.

---

## Ranh giới an toàn y tế

Đây là phần quan trọng nhất của dự án, và nó **nằm trong code chứ không nằm trong prompt**.

Năm điều app không bao giờ làm:

1. Không chẩn đoán bệnh của **người**. Được nói công dụng **của thuốc**.
2. Không đề xuất thay đổi liều — kể cả "uống bù hai viên".
3. Không khuyên tự ngừng hay đổi thuốc, không gợi ý thuốc ngoài hồ sơ.
4. **Không để mô hình ngôn ngữ nhận xét huyết áp / đường huyết cao hay thấp.**
   Việc phân loại chỉ số do [`safetyChecks.js`](src/services/safetyChecks.js) làm bằng
   ngưỡng cứng. LLM chỉ diễn đạt lại kết luận đã tính sẵn.
5. Không bịa tên thuốc, công dụng, hay bất kỳ con số nào không có trong hồ sơ.

Lý do điều 4 tách khỏi LLM: một lần model đọc `180/110` rồi trả lời "chỉ số bình thường"
là đủ để một người không đi cấp cứu khi đáng lẽ phải đi. Rủi ro đó không được phép phụ
thuộc vào chất lượng của một câu prompt.

```bash
npm run test:safety     # 33 test chặn hồi quy an toàn
```

Bộ test này phải xanh trước mọi lần deploy. Chi tiết:
[33-Medical-Safety-Audit.md](AI-Riser-Prep/33-Medical-Safety-Audit.md).

---

## Kiến trúc

```
Trình duyệt (React + Vite)          Firebase Hosting
        │
        │  Firebase ID token kèm mọi request
        ▼
Backend Node (Fastify)              Cloud Run · asia-southeast1
        │
        ├── Gemini API          OCR đơn thuốc, đọc mặt máy đo, trợ lý hội thoại
        ├── Overpass / OSM      tìm nhà thuốc, bệnh viện gần nhà
        └── Firestore           lịch uống thuốc, feed gia đình (realtime)

Google Calendar · Google Tasks      OAuth, người dùng tự cấp quyền từ trình duyệt
```

**Không có API key nào ở phía trình duyệt.** Mọi lời gọi Gemini đi qua
[`apiClient.js`](src/services/apiClient.js) → backend. Thứ duy nhất trong bundle là
Firebase config — vốn là định danh công khai; thứ bảo vệ dữ liệu là
[`firestore.rules`](firestore.rules) và authorized domains.

Chi tiết: [37-Product-Architecture.md](AI-Riser-Prep/37-Product-Architecture.md) ·
[38-Backend-Security.md](AI-Riser-Prep/38-Backend-Security.md)

---

## Tích hợp Google

| Dịch vụ | Dùng để làm gì |
|---|---|
| **Gemini** (Vision + chat) | Đọc đơn thuốc viết tay, đọc số trên máy đo huyết áp, trả lời câu hỏi về thuốc trong hồ sơ |
| **Firebase Auth** | Một lần bấm "Kết nối Google" vừa tạo danh tính vừa xin quyền Calendar/Tasks |
| **Cloud Firestore** | Lịch uống thuốc và feed gia đình, cập nhật realtime giữa máy con và máy ba mẹ |
| **Google Calendar** | Lịch tái khám, kèm link mở thẳng sự kiện |
| **Google Tasks** | Nhắc mua thuốc trước khi hết |
| **Cloud Run** | Backend giữ khoá, kiểm soát hạn mức |
| **Firebase Hosting** | Frontend + rewrite `/api/**` sang Cloud Run |

### Vì sao không dùng Google Maps Places

Google Maps Platform **chặn billing account đăng ký bằng thẻ / giấy tờ Việt Nam**.
Bật Places API từ một project của người dùng VN rơi vào vòng lặp: đòi bật thanh toán →
bật xong vẫn không dùng được → tạo project mới → lặp lại. Đây là ràng buộc ở tầng quốc
gia, không phải lỗi cấu hình.

Nên nguồn dữ liệu là **OpenStreetMap qua Overpass API** — miễn phí, không cần khoá, không
bị chặn ở VN, dữ liệu nhà thuốc tại các thành phố lớn khá đầy.
Code vẫn ưu tiên Google Places nếu môi trường có khoá dùng được, hỏng thì rơi xuống OSM:
[`server/src/routes/places.js`](server/src/routes/places.js).

Một hệ quả đáng nói: OSM hiếm khi có giờ mở cửa, nên trường `is_open` có **ba** trạng thái
— mở / đóng / **chưa rõ**. Bản trước mặc định "đang mở cửa" khi không biết, và điều đó có
thể khiến một bác 70 tuổi đi 3km tới một nhà thuốc đã đóng.

---

## Chạy tại máy

```bash
npm install
cp .env.example .env      # điền cấu hình Firebase
npm run dev
```

Backend:

```bash
cd server && npm install && npm start
```

Định vị (`navigator.geolocation`) chỉ chạy trong secure context — thử trên điện thoại thì
dùng `npm run dev:https` hoặc bản đã deploy, mở qua `http://192.168.x.x` sẽ bị trình duyệt chặn.

### Biến môi trường

Frontend cần cấu hình Firebase (`VITE_FIREBASE_*`) — đây là định danh công khai.
Backend giữ `GEMINI_API_KEY` trong env của Cloud Run, **không bao giờ đặt tiền tố `VITE_`**,
vì mọi biến `VITE_*` đều bị nhúng vào bundle mà ai cũng đọc được.

Danh sách đầy đủ: [.env.example](.env.example) · [40-Setup-Keys-Guide.md](AI-Riser-Prep/40-Setup-Keys-Guide.md)

---

## Kiểm thử & deploy

```bash
npm run test:safety                      # 33 test ranh giới y tế
node server/test/pseudonym.test.mjs      # 16 test ẩn danh hoá dữ liệu
npm run build
npm run deploy                           # Firebase Hosting, dùng token gcloud sẵn có
python3 scripts/make_icons.py            # sinh lại bộ icon PWA
```

---

## Giấy phép & miễn trừ

App giúp **sắp xếp và hiểu** thông tin thuốc. App **không chẩn đoán bệnh, không kê đơn**,
và không thay thế bác sĩ hay dược sĩ. Trường hợp khẩn cấp, gọi **115**.

Dữ liệu địa điểm © những người đóng góp OpenStreetMap, theo giấy phép ODbL.
