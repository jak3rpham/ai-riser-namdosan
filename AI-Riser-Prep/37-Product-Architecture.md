# 37 — Từ prototype sang sản phẩm dùng thật

> Ba yêu cầu Thanh đặt ra ngày 12/08:
> 1. Đầu ra phải là **web dùng được thật** + **app dùng được thật**, không phải màn showcase hai giao diện cạnh nhau
> 2. **Giám khảo phải vào được toàn bộ app** — đăng nhập Google, cấp quyền, đẩy/lấy dữ liệu thật
> 3. **Giao diện ba mẹ phải tự chủ** — con ở xa, ba mẹ vẫn tự lo được
>
> Doc này là đặc tả để Antigravity làm. Đọc kèm [36](36-Google-Integration.md) cho phần khoá và API.

---

## 1. Vấn đề: hiện tại đây là bản trình diễn, không phải sản phẩm

`src/App.jsx` có một thanh chuyển: **Xem 2 màn hình · Web Con gái (P1) · App Ba Mẹ (P2)**.

Đó là công cụ để **kể chuyện**, không phải sản phẩm. Cụ thể nó sai ở đâu:

| Hiện tại | Sản phẩm thật phải là |
|---|---|
| Bấm nút để đổi vai | Vai do **tài khoản** quyết định — đăng nhập xong là biết mình là ai |
| Cùng lúc thấy cả hai màn | Con cái thấy web của con cái. Ba mẹ thấy app của ba mẹ. Không ai thấy cả hai |
| Không có router — chỉ một trang | Có URL riêng, chia sẻ được, quay lại được |
| Không có đăng nhập | Có tài khoản, có dữ liệu của riêng mình |
| `useState` với dữ liệu mẫu, reload là mất | Firestore, mở máy khác vẫn còn |
| Khung điện thoại giả bọc quanh app ba mẹ | Ba mẹ mở trên điện thoại thật của họ |
| Ba mẹ chỉ có một thẻ "đã uống" | Ba mẹ có app đầy đủ, tự dùng được |

> **Giữ lại phần nào:** chế độ xem 2 màn hình vẫn rất có giá trị cho **video demo 2 phút** ([17](17-Product-Spec.md) mục 11) — nó cho thấy hai phía đồng bộ nhau theo thời gian thực. Nên **giữ nhưng giấu sau cờ `?demo=1`**, không để làm mặt tiền của sản phẩm.

---

## 2. Kiến trúc đích

Một codebase, hai bề mặt, phân vai bằng tài khoản.

```
                    ┌──────────────────┐
                    │   Trang chào     │  /
                    │  chọn vai + login│
                    └────────┬─────────┘
                             │
              ┌──────────────┴───────────────┐
              ▼                              ▼
   ┌─────────────────────┐        ┌─────────────────────┐
   │  WEB QUẢN LÝ        │        │  APP BA MẸ          │
   │  /app               │        │  /parent            │
   │  vai: manager       │        │  vai: care_recipient│
   │                     │        │                     │
   │  · máy tính/điện    │        │  · PWA cài được     │
   │    thoại            │        │  · nút to, ít bước  │
   │  · đăng nhập Google │        │  · dùng offline được│
   └──────────┬──────────┘        └──────────┬──────────┘
              │                              │
              └────────► Firestore ◄─────────┘
                     (cùng một family_id)
```

**Cần thêm:** `react-router-dom` — hiện dự án chưa có router nào.

### Bảng đường dẫn

| URL | Ai vào | Nội dung |
|---|---|---|
| `/` | Chưa đăng nhập | Trang chào, chọn vai, nút "Dùng thử ngay" |
| `/app` | Con cái | Dashboard quản lý (chính là `FamilyDashboard` hiện tại) |
| `/app/connect` | Con cái | Kết nối Google (`GoogleConnectPanel`) |
| `/parent` | Ba mẹ | Hôm nay — liều kế tiếp |
| `/parent/cabinet` | Ba mẹ | Tủ thuốc |
| `/parent/ask` | Ba mẹ | Hỏi Cháu Bi |
| `/parent/me` | Ba mẹ | Hồ sơ, dị ứng, mời con cái |
| `/join/:code` | Ai cũng được | Nhận lời mời vào gia đình |
| `/?demo=1` | Chỉ để quay video | Chế độ 2 màn hình như hiện tại |

---

## 3. ⭐ Giám khảo vào được toàn bộ app — tách ĐĂNG NHẬP khỏi CẤP QUYỀN

Đây là phần quan trọng nhất của doc này, và nó **sửa lại khuyến nghị sai** của tôi ở [36](36-Google-Integration.md) bản đầu.

### Vấn đề

Scope `calendar.events` và `tasks` là **sensitive**. Nếu gộp chung vào lần đăng nhập:

- App ở chế độ **Testing** → ai không nằm trong danh sách Test users bị **chặn thẳng**, không bấm tiếp được. Giám khảo dùng tài khoản nào thì không ai biết trước → **giám khảo không vào được app**.

### Cách đúng: ba tầng, mỗi tầng mở thêm một chút

```
TẦNG 0 — Dùng thử ngay, không đăng nhập
   Bấm "Dùng thử" trên trang chào
   Dữ liệu mẫu, lưu tạm ở máy
   → Xem được TOÀN BỘ giao diện và luồng, kể cả bộ hỏi triệu chứng
   → Không cần bất kỳ tài khoản nào

TẦNG 1 — Đăng nhập Google, CHỈ scope email + profile
   Đây KHÔNG phải sensitive scope:
     · không cần Google verification
     · KHÔNG giới hạn 100 người
     · KHÔNG có màn cảnh báo "chưa xác minh"
   → Có tài khoản thật, dữ liệu thật trong Firestore
   → Quét đơn bằng Gemini thật, lưu thật, đồng bộ giữa hai thiết bị thật
   → ĐÂY LÀ "TOÀN BỘ APP" mà giám khảo cần trải nghiệm

TẦNG 2 — "Kết nối Lịch & Việc cần làm" (nút riêng, tuỳ chọn)
   Lúc này mới xin calendar.events + tasks
   → Ai muốn thử thì bấm, không bấm vẫn dùng app bình thường
```

**Điểm mấu chốt:** app phải dùng được **đầy đủ** ở Tầng 1. Google Calendar là *thêm giá trị*, không phải *cửa vào*.

### Cấu hình OAuth nên chọn

| | Khuyến nghị |
|---|---|
| Publishing status | **In production** (KHÔNG nộp verification) |
| Vì sao không để Testing | Testing **chặn thẳng** người ngoài danh sách. Production chưa xác minh thì hiện màn cảnh báo nhưng **bấm tiếp được** qua "Nâng cao → Đi tới (không an toàn)" |
| Giới hạn | App chưa xác minh bị giới hạn 100 người dùng cho scope sensitive — thừa sức cho vòng chấm |
| Scope lúc đăng nhập | `email`, `profile`, `openid` — **chỉ ba cái này** |
| Scope lúc bấm "Kết nối Lịch" | `calendar.events`, `tasks` |

> ⚠️ Google hay đổi giao diện mấy màn này. Lúc setup xong, **tự mở bằng cửa sổ ẩn danh với một tài khoản Google khác** để xem đúng cái giám khảo sẽ thấy. Đây là bài kiểm quan trọng nhất trong cả phần tích hợp.

### Cần cho bài nộp

- [ ] Ghi trong README/bài nộp: *"Đăng nhập không cần quyền đặc biệt. Riêng tính năng đồng bộ Google Calendar cần cấp thêm quyền và app đang ở diện chưa xác minh, nên sẽ có màn cảnh báo của Google — bấm Nâng cao để tiếp tục."* Nói trước thì giám khảo không hiểu nhầm là app lỗi.
- [ ] Chuẩn bị **một tài khoản demo sẵn dữ liệu** phòng khi giám khảo không muốn dùng tài khoản riêng.
- [ ] Trang chính sách riêng tư (cũng là điều kiện nếu sau này nộp verification).

---

## 4. ⭐ Ba mẹ tự chủ

> *"con cái xa cha mẹ và cha mẹ vẫn có thể tự handle được"*

Thiết kế hiện tại giả định con cái làm hộ mọi thứ ([21](21-UI-Exploration.md): *"Con cái setup hộ 100%"*). Giả định đó **sai** với phần lớn thực tế: con đi làm xa, ba mẹ ở quê, và người cần dùng app nhất lại là người không có ai bấm hộ.

### Ba mẹ phải tự làm được, không cần con

| Việc | Hiện tại | Phải thành |
|---|---|---|
| Tạo tài khoản | Chỉ có mã mời từ con | **Tự đăng ký được** — bằng Google hoặc chỉ một mã PIN |
| Thêm thuốc mới | Chỉ con cái làm | **Tự chụp đơn** — mở thẳng camera, nút to |
| Sửa giờ uống | Không có | Tự đổi cữ |
| Hỏi về thuốc | Có (Cháu Bi) | Giữ, cho vào tab riêng |
| Ghi huyết áp | Chỉ ở web con cái | Đưa sang app ba mẹ — người đo là ba mẹ |
| Tìm nhà thuốc | Chỉ ở web con cái | Đưa sang app ba mẹ |
| Gọi cấp cứu | Có | Giữ, để nổi bật |
| Mời con vào xem | Không có | **Đảo chiều: ba mẹ mời con** |

Điểm cuối quan trọng: luồng mời hiện chỉ đi một chiều **con → ba mẹ**. Phải chạy được **cả hai chiều**. Ba mẹ dùng trước, con vào sau, cũng là một câu chuyện hay cho bài nộp.

### Điều hướng app ba mẹ

Hiện chỉ có một thẻ duy nhất. Cần thanh tab dưới cùng, 4 mục, chữ to kèm biểu tượng:

```
┌─────────────────────────────────────┐
│                                     │
│         (nội dung tab)              │
│                                     │
├─────────────────────────────────────┤
│  💊       📦        🎙️       👤     │
│ Hôm nay  Tủ thuốc  Hỏi cháu   Tôi   │
└─────────────────────────────────────┘
```

### Ràng buộc thiết kế (theo mức khả năng C1–C4 ở [21](21-UI-Exploration.md))

- Mỗi màn **một hành động chính**, nút cao tối thiểu 56px
- Không bắt gõ phím ở đâu **bắt buộc** — luôn có đường đi bằng chọn hoặc bằng giọng nói
- Chữ tối thiểu 17px cho nội dung, 20px cho nút chính
- Không có menu ẩn, không vuốt để lộ chức năng — mọi thứ nhìn thấy được
- **Chạy được khi mạng chập chờn**: ghi vào máy trước, đồng bộ sau. Ba mẹ ở quê sóng yếu là chuyện thường
- Chụp đơn thuốc: mở thẳng camera sau, có khung căn và nhắc *"bác lật mặt có chữ giúp con"* ([32](32-Pharmacy-Mode.md))

### ⚠️ Điều này làm phần an toàn nặng hơn

Ba mẹ tự nhập thuốc, không có con kiểm lại → **màn xác nhận của [33](33-Medical-Safety-Audit.md) mục 9 trở thành lớp bảo vệ duy nhất**.

Phải làm thêm:
- Cảnh báo an toàn ở app ba mẹ phải viết **dễ hiểu hơn nữa** — người đọc không phải người sẽ đi hỏi bác sĩ giùm
- Cảnh báo mức `CRITICAL` (dị ứng, trùng hoạt chất) → **tự động báo cho con cái**, kể cả khi ba mẹ bỏ qua
- Ba mẹ tự thêm thuốc → gửi thông báo cho con cái để con biết mà kiểm

---

## 5. 🔲 Việc giao cho Antigravity

Làm theo thứ tự. Mỗi bước xong phải chạy được rồi mới sang bước sau.

### P0 — Router + đăng nhập + phân vai

- Thêm `react-router-dom`
- `src/routes/` với các đường dẫn ở mục 2
- `AuthGate`: chưa đăng nhập → về `/`; sai vai → về đúng nhà của mình
- Trang chào `/`: chọn vai + "Dùng thử ngay" (Tầng 0) + "Đăng nhập Google" (Tầng 1)
- **Sửa `googleAuth.js`**: tách `signInWithGoogleIdentity()` (chỉ `email profile openid`) khỏi `connectGoogle()` (thêm scope sensitive). Hiện đang gộp làm một — đây là thay đổi bắt buộc cho mục 3
- Lưu vai vào Firestore `users/{uid}` → `{ role, family_id }`

### P1 — Bộ khung app ba mẹ

- `ParentApp` với thanh tab 4 mục
- Chuyển `HealthTrackerCard` và `NearbyHealthcareModal` sang phía ba mẹ (vẫn giữ ở web con cái để con theo dõi)
- Ba mẹ tự chụp đơn: dùng lại `PrescriptionUploadWizard` nhưng rút gọn, chữ to
- Bỏ khung điện thoại giả khi chạy ở `/parent` — chỉ giữ ở chế độ `?demo=1`

### P2 — Ba mẹ tự đăng ký + mời hai chiều

- Đăng ký cho ba mẹ không cần con
- Sinh mã mời, màn `/join/:code`
- Ba mẹ mời con · con mời ba mẹ — cùng một cơ chế
- Màn "ai đang xem thông tin của tôi" ([23](23-Security-Privacy.md) mục 6, rủi ro E2) — **bắt buộc**, chưa làm

### P3 — PWA cài được

- `manifest.json`: `display: standalone`, icon 192/512, `theme_color` khớp `index.html`
- Service worker: cache vỏ app + hàng đợi ghi khi offline
- Nhắc "Thêm vào Màn hình chính" cho ba mẹ ở lần mở thứ 2
- iOS: các thẻ meta đã có sẵn trong `index.html` ([34](34-Testing-On-iPhone.md) mục 4)

### P4 — Dọn chế độ trình diễn

- Thanh chuyển vai chỉ hiện khi có `?demo=1`
- Nút "Reset Demo" cũng vậy
- Đường dẫn mặc định là sản phẩm thật

> Các việc T1–T5 ở [36](36-Google-Integration.md) mục 4 vẫn còn nguyên. Nên làm **P0 trước T1**, vì T1 (gắn panel kết nối) phụ thuộc vào việc có router và có vai.

---

## 6. Thứ tự khuyên làm, tính theo thời gian còn lại

Còn khoảng 18 ngày tới 30/08.

| Ưu tiên | Việc | Vì sao |
|---|---|---|
| 1 | Thanh lấy khoá ([36](36-Google-Integration.md) mục 2) | Chặn mọi thứ khác |
| 2 | **P0** router + đăng nhập tách tầng | Chặn phần giám khảo vào app — yêu cầu số 2 |
| 3 | T4 Firestore ([36](36-Google-Integration.md)) | Không có cái này thì "dùng thật" vô nghĩa, reload là mất |
| 4 | **P1** khung app ba mẹ | Yêu cầu số 3 |
| 5 | T1 + T3 Calendar | Cho thấy tích hợp Google chạy thật |
| 6 | **P2** tự đăng ký + mời hai chiều | Hoàn thiện phần tự chủ |
| 7 | T2 Maps · **P3** PWA · **P4** dọn demo | Làm đẹp |

**Nếu hết thời gian thì cắt từ dưới lên** ([27](27-Risk-Register.md) R4). Ba việc 1–3 là không được cắt: thiếu chúng thì app vẫn là prototype.

---

## 7. Định nghĩa "xong"

Không tính là xong cho tới khi cả bốn câu này đều đúng:

1. Mở một cửa sổ ẩn danh, đăng nhập bằng **tài khoản Google chưa từng dùng**, tạo được gia đình, quét được một đơn thuốc, thấy nó lưu lại sau khi reload.
2. Trên một chiếc điện thoại **khác**, ba mẹ đăng nhập và thấy đúng đơn thuốc đó, bấm "đã uống" xong thì web con cái hiện lên trong vài giây.
3. Ba mẹ **tự** chụp thêm một đơn mới **mà không cần con cái đụng vào**, và cảnh báo an toàn vẫn chạy.
4. Toàn bộ ba bước trên làm được **mà không cần bấm "Kết nối Lịch"**.

Câu 4 chính là câu quyết định giám khảo có vào được app hay không.
