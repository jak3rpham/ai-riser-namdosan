# 23 — Bảo mật & Quyền riêng tư (v1)

> Đây là app chứa **dữ liệu y tế của người thân** — loại dữ liệu nhạy cảm nhất. Với app vibe-code, rủi ro lớn nhất KHÔNG phải hacker giỏi, mà là **security rules mặc định quá lỏng** do AI sinh ra. File này là danh sách bắt buộc cho Antigravity.

## 1. Phân loại dữ liệu

| Mức | Dữ liệu | Xử lý |
|---|---|---|
| 🔴 **Rất nhạy cảm** | Ảnh đơn thuốc/xét nghiệm (chứa họ tên, tuổi, chẩn đoán, bác sĩ), bệnh nền, dị ứng, chỉ số sức khỏe | Mã hóa khi lưu trữ & truyền; chỉ trong phạm vi gia đình; không bao giờ public |
| 🟠 Nhạy cảm | Danh sách thuốc, lịch uống, log tuân thủ | Phạm vi gia đình |
| 🟡 Thường | Tên gọi thân mật, ảnh đại diện, cấu hình | Phạm vi gia đình |
| 🟢 **Công khai được** | `med_catalog`, `interactions_cache` (thông tin thuốc & tương tác) | **PHẢI phi định danh 100%** — xem mục 4 |

## 2. ⚠️ Rủi ro #1: Firestore Security Rules

**Mặc định nguy hiểm:** AI thường sinh rule kiểu `allow read, write: if request.auth != null;` → **bất kỳ ai đăng nhập đều đọc được dữ liệu của MỌI gia đình**. Đây là lỗ hổng phổ biến nhất của app vibe-code.

**Nguyên tắc bắt buộc: deny-by-default + phạm vi gia đình.** Khung rule cần đạt:

```
// Ai thuộc gia đình fid?
function inFamily(fid) {
  return exists(/databases/$(db)/documents/families/$(fid)/access/$(request.auth.uid));
}
function roleOf(fid) {
  return get(/databases/$(db)/documents/families/$(fid)/access/$(request.auth.uid)).data.role;
}

match /families/{fid} {
  allow read:  if inFamily(fid);
  allow write: if inFamily(fid) && roleOf(fid) == 'manager';

  match /members/{mid}/{doc=**} {
    allow read:  if inFamily(fid);
    // người được chăm sóc chỉ được ghi log "đã uống" của chính mình
    allow write: if inFamily(fid) && (roleOf(fid) == 'manager' || isSelfAdherence(fid, mid));
  }
}

match /med_catalog/{slug}      { allow read: if true; allow write: if false; }  // chỉ backend ghi
match /interactions_cache/{id} { allow read: if true; allow write: if false; }
```

**Checklist rules:**
- [ ] Không có bất kỳ `allow read/write: if true` nào cho dữ liệu người dùng.
- [ ] Mọi truy cập đều kiểm tra **thành viên của gia đình đó**, không chỉ "đã đăng nhập".
- [ ] Ba mẹ (role được-chăm-sóc) **không sửa được** hồ sơ, chỉ xác nhận liều của chính mình.
- [ ] `med_catalog` / `interactions_cache`: đọc công khai, **ghi chỉ từ server**.
- [ ] Test rules bằng Firebase Rules Playground trước khi deploy.

## 3. Firebase Storage (ảnh tài liệu y tế)
- Đường dẫn theo gia đình: `families/{fid}/members/{mid}/docs/{docId}.jpg`, rule y hệt Firestore.
- **Không dùng URL public**; dùng signed URL thời hạn ngắn.
- Giới hạn: định dạng ảnh/PDF, dung lượng tối đa (vd 10MB), số file/ngày/tài khoản.
- Cho phép **xóa vĩnh viễn** ảnh sau khi đã trích xuất (tùy chọn của người dùng — nhiều người không muốn giữ ảnh đơn thuốc).

## 4. 🔒 Nguyên tắc VÀNG: kho dùng chung phải phi định danh
`med_catalog` và `interactions_cache` được **mọi gia đình dùng chung** để giảm chi phí ([22](22-Business-Model.md)) → nếu lọt dữ liệu bệnh nhân vào đó là **rò rỉ chéo giữa các gia đình**.

**Bắt buộc:**
- Chỉ ghi vào kho chung các trường **thuộc về thuốc**: tên hoạt chất, biệt dược, công dụng, lưu ý, tương tác. **Không bao giờ** ghi tên người, tuổi, chẩn đoán, liều cá nhân.
- Tách rõ 2 lời gọi AI: (a) *trích xuất đơn* → kết quả về hồ sơ riêng tư; (b) *tra cứu kiến thức thuốc* → chỉ gửi **tên hoạt chất**, kết quả vào kho chung.
- Khóa cache = hash(tên hoạt chất chuẩn hóa + ngôn ngữ) — không chứa ID người dùng.

## 5. Dữ liệu gửi cho AI
- **Tối thiểu hóa:** khi hỏi kiến thức thuốc, chỉ gửi tên thuốc — không gửi kèm hồ sơ bệnh nhân.
- Ảnh đơn thuốc buộc phải gửi để trích xuất → nêu rõ trong chính sách riêng tư.
- **Không log prompt/response chứa PII** vào hệ thống log. Log token usage thì được, log nội dung thì không.
- API key luôn ở server (AI Studio mặc định làm đúng — không được "tối ưu" bằng cách đưa key ra client).

## 6. Sự đồng ý của người thân (đạo đức + pháp lý)
Con cái nhập dữ liệu y tế **của người khác** → phải xử lý tử tế:
- Khi thêm thành viên: buộc tick **"Tôi được người thân đồng ý cho quản lý thông tin sức khỏe"**.
- App của ba mẹ có màn hình **"Ai đang xem thông tin của tôi"** — liệt kê rõ người quản lý, và nút yêu cầu gỡ.
- Không có tính năng theo dõi lén: mọi thứ con cái thấy, ba mẹ đều xem được.
- *Reasoning:* vừa đúng đạo lý, vừa là câu trả lời khi giám khảo hỏi về đạo đức dữ liệu; cũng khớp triết lý "an tâm ≠ giám sát".

## 7. Kịch bản đe dọa & phòng vệ

| Kịch bản | Phòng vệ |
|---|---|
| Người lạ đăng nhập, dò dữ liệu nhà khác | Firestore rules phạm vi gia đình (mục 2) |
| Điện thoại ba mẹ mất/cho người khác | Web của con có nút **gỡ thiết bị / thu hồi quyền** ngay |
| Link mời (Zalo) bị chuyển tiếp nhầm | Token mời **hết hạn ngắn (vd 24h) + dùng 1 lần** + hiện tên gia đình để xác nhận trước khi vào |
| Thành viên trong nhà lạm quyền | Nhật ký thay đổi (ai sửa gì, khi nào) hiển thị cho cả nhà |
| Upload ảnh rác/tấn công | Giới hạn dung lượng, định dạng, số lần/ngày ([24](24-Scale-Cost-Control.md)) |
| Chọn nhầm thành viên khi nhập đơn | Màn xác nhận hiển thị **to, rõ** tên + ảnh người nhận đơn trước khi lưu |

## 8. Tuân thủ khi publish

**Google Play (app sức khỏe):**
- [ ] **Privacy Policy công khai** (bắt buộc, phải có URL) — nêu rõ: thu thập gì, gửi gì cho AI, lưu ở đâu, cách xóa.
- [ ] Khai **Data Safety form** trung thực (có thu thập dữ liệu sức khỏe).
- [ ] Không mô tả app là **chẩn đoán/điều trị** → tránh bị xếp vào nhóm thiết bị y tế và bị gỡ.
- [ ] Xin đúng quyền cần thiết (camera, thông báo); không xin quyền thừa.

**Google API Services (Calendar/Tasks):** dùng đúng scope tối thiểu, có màn hình giải thích trước khi xin quyền, không dùng dữ liệu cho mục đích khác. (Tránh Gmail scope — [15](15-Google-Ecosystem.md).)

**Trong sản phẩm:** disclaimer "không thay thế bác sĩ" ở onboarding + mọi màn hình giải thích/cảnh báo ([17](17-Product-Spec.md) mục 10).

## 9. Quyền của người dùng
- **Xuất dữ liệu:** tải toàn bộ hồ sơ 1 thành viên (JSON/PDF).
- **Xóa:** xóa 1 thành viên hoặc cả gia đình → xóa thật, kể cả ảnh trong Storage.
- **Rời gia đình:** người quản lý tự gỡ mình.

## ✅ Checklist tối thiểu trước khi demo công khai
- [ ] Firestore + Storage rules đã test, deny-by-default
- [ ] Kho dùng chung không chứa PII
- [ ] Privacy policy có URL thật
- [ ] Không log PII
- [ ] Link mời hết hạn + dùng 1 lần
- [ ] Disclaimer hiển thị
- [ ] Nút xóa dữ liệu hoạt động
