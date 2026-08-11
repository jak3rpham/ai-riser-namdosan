# 32 — Chế độ Nhà thuốc & Minh bạch đơn thuốc (v1)

> Hai ý Thanh nêu 11/08: **(a)** dùng app khi ra nhà thuốc mua thuốc cho người nhà; **(b)** nhà thuốc bán kèm thuốc không cần thiết → app nên có bước xem xét. Cộng thêm bài toán **vỉ thuốc kín không thấy viên**.

---

## 1. 🏪 Chế độ Nhà thuốc (M22 — đề xuất MVP)

**Tình huống thật:** con cái (hoặc chính bác) ra nhà thuốc. Người bán hỏi *"đang uống thuốc gì rồi?"* → thường trả lời ú ớ, hoặc chìa cái túi thuốc cũ nhàu.

**Giải pháp: một màn hình duy nhất, mở ra là đưa cho dược sĩ xem.**

```
┌────────────────────────────────────┐
│  BÁC PHẠM VĂN HÙNG · 68 tuổi       │
│  Dị ứng: Penicillin ⚠️              │
├────────────────────────────────────┤
│  ĐANG UỐNG                         │
│  • Amlodipine 5mg — sáng 1 viên    │
│    (huyết áp, dài hạn)             │
│  • Omeprazole 20mg — 2 lần/ngày    │
│    (dạ dày, còn 2 ngày là hết đợt) │
│  • Atorvastatin 10mg — tối 1 viên  │
├────────────────────────────────────┤
│  CẦN MUA THÊM                      │
│  • Amlodipine — còn 3 ngày         │
├────────────────────────────────────┤
│  Bệnh nền: tăng huyết áp, mỡ máu   │
│                          [ Xong ]  │
└────────────────────────────────────┘
```

**Cách dùng (Thanh làm rõ 11/08): chỉ cần MỞ RA ĐƯA HỌ XEM.** Không quét QR, không cần dược sĩ thao tác gì — họ chỉ nhìn màn hình. Đơn giản nhất, không rào cản, không lo dữ liệu đi đâu.
- Một nút duy nhất trên trang chủ: **"Đưa nhà thuốc xem"** → mở màn hình toàn màn, chữ to, không có nút gây bấm nhầm.
- Tự động tắt sau vài phút hoặc khi bấm Xong.
- 🗄️ *(V2, nếu có nhu cầu thật)*: nút chia sẻ link chỉ-đọc cho nhà thuốc quen. Không làm ở MVP.

**Giá trị:**
- Dược sĩ có đủ thông tin để **tránh bán trùng, tránh bán thuốc kỵ nhau**.
- Không phải nhớ, không phải mang túi thuốc cũ đi.
- Dùng được cả khi đi khám bác sĩ (chỉ cần đổi tiêu đề màn hình).

> 🔲 Cân nhắc: đây có thể là **tính năng dễ demo và dễ kể chuyện nhất** — cảnh "chìa điện thoại cho dược sĩ" rất trực quan trong video 2 phút.

---

## 2. 💊 Minh bạch túi thuốc — xử lý chuyện "bán thuốc không cần thiết"

Ý Thanh đúng với thực tế VN: nhiều nhà thuốc bán kèm vitamin, men tiêu hóa, thuốc bổ gan, thậm chí kháng sinh khi không cần.

### ⚠️ Nhưng phải làm ĐÚNG CÁCH
App **không được** phán *"thuốc này không cần thiết"* — đó là phán xét chuyên môn y tế, sai một lần là mất hết uy tín (và có thể gây hại nếu người dùng bỏ thuốc thật sự cần).

**Cách an toàn mà vẫn đúng ý: MINH BẠCH, KHÔNG PHÁN XÉT.**

App **phân loại và trình bày**, người dùng tự quyết:

| Nhóm | Nội dung | Cách hiển thị |
|---|---|---|
| 🔵 **Thuốc điều trị chính** | Có trong toa bác sĩ, trị đúng bệnh nền | "Thuốc chính theo toa" |
| 🟢 **Thuốc hỗ trợ / giảm triệu chứng** | Giảm đau, hạ sốt, chống nôn… | "Thuốc giảm triệu chứng" |
| 🟡 **Thực phẩm chức năng / vitamin / thuốc bổ** | **Không phải thuốc điều trị** | "Thực phẩm chức năng — không phải thuốc chữa bệnh" |
| 🔴 **Trùng hoạt chất** | Hai món cùng hoạt chất (T15) | Cảnh báo đỏ |

**Ví dụ hiển thị sau khi chụp túi thuốc:**
> **Túi thuốc có 5 món:**
> 🔵 2 thuốc điều trị theo toa (kháng sinh, dạ dày)
> 🟢 1 thuốc giảm đau
> 🟡 **2 thực phẩm chức năng** (men tiêu hóa, bổ gan) — *không phải thuốc chữa bệnh*
>
> 💬 *"Nếu nhà mình muốn tiết kiệm, có thể hỏi lại nhà thuốc xem 2 món thực phẩm chức năng có thật sự cần trong đợt này không ạ."*

**Vì sao cách này an toàn mà vẫn mạnh:**
- Không nói "thuốc này thừa" — chỉ **nói đúng bản chất từng món** (thực phẩm chức năng đúng là không phải thuốc điều trị, đây là dữ kiện, không phải ý kiến).
- Trao **câu hỏi** cho người dùng, không trao **kết luận**.
- Người dùng tự có quyền lực khi đối thoại với nhà thuốc — đúng tinh thần "trao quyền", không phải "thay bác sĩ".

### Các tín hiệu khác app có thể nêu (dưới dạng câu hỏi)
| Tín hiệu | Câu app nói |
|---|---|
| **Trùng hoạt chất** (T15) | "Hai món này cùng hoạt chất — hỏi lại nhà thuốc nha" |
| **Quá nhiều thuốc** (≥8–10 loại) | "Bác đang uống 9 loại thuốc. Lần khám tới nhờ bác sĩ rà lại giúp xem có món nào bỏ bớt được không nha." *(khái niệm y khoa có thật: rà soát giảm thuốc)* |
| **Kháng sinh không có toa bác sĩ** | "Món này là kháng sinh — thường cần bác sĩ kê. Nhà mình có toa không ạ?" |
| **Mua lặp bất thường** | "Tháng này nhà mình mua thuốc dạ dày 3 lần rồi — có nên đi khám lại không ạ?" |

> Tất cả đều là **câu hỏi gợi mở**, kết thúc bằng việc hỏi người có chuyên môn. Không có câu nào là kết luận y khoa.

---

## 3. 📷 Vỉ thuốc kín, không thấy viên — giải quyết thế nào

**Vấn đề Thanh nêu:** vỉ còn nguyên, viên nằm trong lớp nhôm → không thấy màu/hình viên → làm sao bảo bác uống viên nào?

**Nhận ra vấn đề gốc:** t đã sai khi mặc định người già nhận diện thuốc **bằng viên**. Thực tế họ cầm trên tay **cái vỉ / cái hộp** — và nhận ra nó bằng **màu vỏ, chữ, hình dáng bao bì**.

### → Đổi "mỏ neo nhận diện" từ VIÊN sang BAO BÌ

| Ưu tiên | Ảnh nhận diện | Vì sao |
|---|---|---|
| 1️⃣ **Ảnh vỉ/hộp nguyên** (mặt có chữ) | ⭐ Tốt nhất | Đúng thứ bác cầm trên tay; có chữ để AI đọc; có màu sắc đặc trưng |
| 2️⃣ Ảnh hộp giấy | Tốt | Nhiều bác giữ nguyên hộp |
| 3️⃣ Ảnh viên rời | Bổ sung | Chỉ hữu ích khi bác đã bóc ra để sẵn |

Trên màn hình nhắc, hiển thị: **ảnh vỉ + mô tả cách nói của người nhà** — *"vỉ màu xanh, chữ vàng"* — vì đó là cách người già thực sự phân biệt.

### Hướng dẫn chụp mặt nào (Thanh hỏi: khó không?)
**Không khó** — làm bằng hướng dẫn trực quan + kiểm tra tại chỗ:
```
Mở camera → khung viền + chữ to: "Bác chụp mặt CÓ CHỮ giúp con nha"
   ↓
Kiểm tra nhanh phía máy: có phát hiện chữ trong ảnh không?
   ↓ không có
"Mặt này con không đọc được chữ, bác lật mặt kia giúp con ạ" → chụp lại
   ↓ có
"Dạ được rồi, cảm ơn bác!"
```
- Vỉ nhôm hầu như **luôn in tên thuốc + hàm lượng + hạn dùng** trên mặt nhôm → đây là mặt cần chụp.
- Nếu vỉ mờ/tróc chữ → hỏi chụp **hộp giấy**; vẫn không được → nhập tay.
- Chi phí: kiểm tra "có chữ hay không" nên làm **phía client** trước khi gửi AI ([24](24-Scale-Cost-Control.md)).

---

## 4. Tác động tới data model
```
medications thêm:
  package_photo_ref     ← ảnh vỉ/hộp (mỏ neo nhận diện chính)
  package_description   ← "vỉ xanh chữ vàng" (cách người nhà gọi)
  pill_photo_ref        ← ảnh viên (tùy chọn, bổ sung)
  product_class         ← thuốc_điều_trị | hỗ_trợ | thực_phẩm_chức_năng
  prescribed_by_doctor  ← true/false (có trong toa hay nhà thuốc bán thêm)
```
`product_class` là trường phục vụ mục 2 — phân loại minh bạch.

## 5. Việc cần làm 🔲
- [ ] Chốt M22 Chế độ Nhà thuốc có vào MVP không (t đề xuất **có** — rẻ, dễ demo, giá trị rõ)
- [ ] Seed `product_class` cho các thực phẩm chức năng phổ biến VN (men tiêu hóa, bổ gan, vitamin tổng hợp…)
- [ ] Soạn câu chữ cho phần minh bạch túi thuốc — **rà kỹ giọng điệu**, tuyệt đối không chê nhà thuốc
- [ ] Test luồng hướng dẫn chụp mặt vỉ trên vỉ thuốc thật, nhiều loại bao bì
