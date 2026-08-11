# 30 — Nền tảng kiến thức Dược (v1)

> Nguyên tắc Thanh đặt ra (11/08): *"kiến thức dược dùng để **reasoning cho AI**, chứ không phải để cung cấp, khiến người dùng bị overload kiến thức mà họ không cần phải nhớ."*
> Đây là một nguyên tắc kiến trúc thông tin, không chỉ là chuyện nội dung.

## 1. Ba tầng — kiến thức đi vào, hành động đi ra

```
TẦNG 1 — KHO KIẾN THỨC (sâu, đầy đủ, người dùng KHÔNG BAO GIỜ thấy)
   hoạt chất · biệt dược VN · nhóm thuốc · tương tác · thời điểm uống ·
   bảo quản · tác dụng phụ · dấu hiệu nguy hiểm
                        ↓
TẦNG 2 — SUY LUẬN CỦA HỆ THỐNG (âm thầm, chạy nền)
   "hai thuốc này cùng hoạt chất" · "thuốc này kỵ bưởi" ·
   "thuốc này phải uống lúc đói" · "đợt này còn 2 ngày"
                        ↓
TẦNG 3 — THỨ NGƯỜI DÙNG THẤY (tối thiểu, đúng lúc, hành động được)
   "Bữa trưa nay mình tránh bưởi nha bác 🍊"
```

**Quy tắc vàng:** mỗi mẩu kiến thức chỉ được xuất hiện dưới dạng **tối đa một câu hành động được, đúng vào lúc nó có ích**. Không bao giờ là một trang thông tin để người dùng đọc và ghi nhớ.

| ❌ Không làm | ✅ Làm |
|---|---|
| Trang "Thông tin thuốc Atorvastatin" dài 2 màn hình | Một dòng trước bữa ăn: *"tuần này tránh bưởi nha bác"* |
| Liệt kê 15 tác dụng phụ | Chỉ nêu **dấu hiệu cần đi khám**, khi có liên quan |
| "Thuốc ức chế men khử HMG-CoA reductase" | *"thuốc giảm mỡ máu"* |
| Bắt người dùng nhớ thuốc nào kỵ gì | Hệ thống nhớ hộ, chỉ nhắc đúng thời điểm |

*Vì sao:* người già không cần trở thành dược sĩ — họ cần **uống đúng thuốc, đúng giờ, tránh đúng món**. Kiến thức là nhiên liệu cho hệ thống, không phải sản phẩm giao cho người dùng.

## 2. Kho kiến thức cần có những gì

| Nhóm | Nội dung | Phục vụ tính năng |
|---|---|---|
| **Ánh xạ biệt dược ↔ hoạt chất** ⭐ | Tên thương mại VN → hoạt chất chuẩn (Panadol/Efferalgan/Hapacol → paracetamol) | **T15 — phát hiện trùng hoạt chất** ([29](29-Process-Audit.md)); chuẩn hóa mọi thứ khác |
| Nhóm thuốc | Huyết áp, tiểu đường, mỡ máu, kháng sinh, giảm đau… | Gọi tên dân dã ("viên huyết áp"); phân loại đợt/dài hạn |
| **Tương tác thuốc–thuốc** | Cặp hoạt chất + mức độ | Cảnh báo khi thêm đơn mới |
| **Tương tác thuốc–thức ăn** ⭐ | Món ăn Việt phổ biến | M12 — tính năng đặc trưng |
| Thời điểm uống | Trước/sau ăn, lúc đói, trước ngủ, cách xa thuốc khác | Sinh lịch nhắc thông minh |
| **Quy tắc quên liều** ⭐ | `missed_dose_rule` (mặc định: quy tắc chuẩn) + cờ `special_missed_dose` cho nhóm cần xử lý riêng (chống đông, insulin, tuyến giáp, động kinh, tim mạch đặc biệt, HIV/lao) | Trợ lý trả lời **Mức 2** ([31](31-Assistant-Conversations.md)) — câu hỏi phổ biến nhất của người già |
| Uống trễ / uống cùng thứ khác | Dung sai thời gian; kỵ sữa/canxi/sắt; cách xa thuốc khác bao lâu | Trả lời dứt khoát thay vì đẩy sang bác sĩ |
| Bảo quản | Tủ lạnh, tránh ánh sáng, hạn sau khi mở | Nhắc trong tủ thuốc |
| Dấu hiệu cần đi khám | Biểu hiện bất thường đáng lo | Chỉ hiện khi người dùng hỏi hoặc có báo cáo triệu chứng |
| Mẫu đợt điều trị | Kháng sinh phải uống hết đợt; thuốc mãn tính không tự ngừng | M18 vòng đời đợt thuốc |

## 3. Xây kho bằng cách nào

**Ba nguồn, ba mức tin cậy:**

| Nguồn | Cách làm | Cờ `verified` |
|---|---|---|
| **Seed thủ công** ⭐ | Thanh/Antigravity nhập tay **50–100 thuốc phổ biến nhất VN** (huyết áp, tiểu đường, mỡ máu, dạ dày, giảm đau, kháng sinh thông dụng) — đối chiếu tờ hướng dẫn sử dụng & nguồn dược đáng tin | `true` |
| **AI sinh + kiểm** | Gemini sinh thông tin cho thuốc chưa có → **rà lại trước khi dùng cho cảnh báo nghiêm trọng** | `pending` |
| **Học từ đơn thật** | Mỗi lần trích xuất đơn, tên biệt dược mới được ghi nhận → làm giàu ánh xạ | `false` |

**Quy tắc an toàn theo mức tin cậy:**
- Cảnh báo **nghiêm trọng** (trùng hoạt chất, tương tác nặng) → **chỉ kích hoạt khi dữ liệu `verified`**. Chưa verify thì im lặng còn hơn báo sai.
- Thông tin **mềm** (gọi tên dân dã, công dụng chung) → dùng được ở mức `pending`.
- Không bao giờ hiển thị thông tin có `verified: false` như một lời khẳng định.

> 💡 **Đây chính là "tài sản dữ liệu" trong luận điểm moat** ([22](22-Business-Model.md)): kho ánh xạ biệt dược VN + tương tác thức ăn Việt là thứ đối thủ mới phải bắt đầu từ con số 0.

## 4. Ranh giới không được vượt

Kiến thức dược **KHÔNG** được dùng để:
- ❌ Tính hay gợi ý liều lượng ([17](17-Product-Spec.md) mục 7c)
- ❌ Suy ra bệnh từ danh sách thuốc rồi nói với người dùng (*"bác đang bị tiểu đường"* — dù đoán đúng cũng không được nói, đó là chẩn đoán)
- ❌ Khuyên ngừng/đổi thuốc
- ❌ Thay thế tờ hướng dẫn sử dụng hay lời dặn của bác sĩ

Kiến thức dược **ĐƯỢC** dùng để:
- ✅ Phát hiện trùng lặp & xung đột → **đẩy người dùng đi hỏi bác sĩ**
- ✅ Dịch ngôn ngữ y khoa sang lời người thường
- ✅ Sinh lịch uống đúng (trước/sau ăn, cách xa nhau)
- ✅ Nhắc đúng thứ, đúng lúc

## 5. Cách kiến thức hiện ra (progressive disclosure)

```
Mặc định:      1 câu hành động được, đúng thời điểm
Chạm vào:      2–3 câu giải thích "vì sao"
Chạm tiếp:     thông tin đầy đủ (dành cho con cái, không phải ba mẹ)
```
- Phía **ba mẹ**: dừng ở tầng 1, tối đa tầng 2.
- Phía **con cái** (web): được phép vào tầng 3 — họ là người cần hiểu để quyết định và trao đổi với bác sĩ.

## 6. Việc cần làm 🔲
- [ ] Chốt danh sách **50–100 thuốc phổ biến VN** để seed (ưu tiên nhóm bệnh mãn tính người già)
- [ ] Với mỗi thuốc seed: hoạt chất · các biệt dược thường gặp · tên gọi dân dã · thời điểm uống · món kiêng · nhóm đợt/dài hạn
- [ ] Xây bảng ánh xạ biệt dược → hoạt chất (quan trọng nhất, phục vụ T15)
- [ ] Quy trình rà soát: ai kiểm, kiểm thế nào, đánh dấu `verified` khi nào
- [ ] 🔲 Cân nhắc: nhờ **một dược sĩ thật** rà giúp phần cảnh báo nghiêm trọng — vừa an toàn, vừa là chi tiết đáng kể trong bài nộp ("có dược sĩ tham gia kiểm chứng dữ liệu")
