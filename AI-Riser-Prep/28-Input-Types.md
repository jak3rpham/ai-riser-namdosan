# 28 — Toàn bộ loại Input & mức khả thi (v1)

> Yêu cầu Thanh: *"kế hoạch cần consider đến tất cả các loại input có thể"*. Mỗi loại đều ghi rõ: AI làm được đến đâu, rủi ro gì, xử lý thế nào.
> **Nguyên tắc xuyên suốt:** loại input nào AI có thể **đoán sai một cách nguy hiểm** thì KHÔNG cho AI quyết — chỉ dùng làm dữ liệu phụ trợ.

## Bảng tổng hợp

| # | Loại input | AI xử lý được? | Rủi ro | Cách xử lý |
|---|---|---|---|---|
| 1 | **Đơn thuốc in** (bệnh viện, phòng khám) | 🟢 Rất tốt | Thấp | Luồng chính. Trích xuất đầy đủ |
| 2 | **Đơn thuốc viết tay** | 🟡 Trung bình | Đọc nhầm liều/tên | Confidence ≤0.85, **bắt buộc người xác nhận**; khuyến khích chụp thêm túi thuốc |
| 3 | **Túi/nhãn nhà thuốc** | 🟢 Tốt | Thấp | ⭐ Khuyến khích nhất — chữ in, có liều rõ, dễ đọc hơn đơn viết tay |
| 4 | **Vỉ thuốc (blister) có in tên** | 🟢 Tốt | Thấp | Đọc tên + hàm lượng từ bao bì. Dùng để **bổ sung thuốc lẻ** không có trong đơn |
| 5 | **Hộp thuốc có nhãn** | 🟢 Tốt | Thấp | Như #4, thêm được hạn dùng & số lô |
| 6 | **Viên thuốc trần (không bao bì)** | 🔴 **KHÔNG** | ☠️ **Rất nguy hiểm** | **CẤM để AI định danh** — xem mục "Ranh giới đỏ" |
| 7 | Chai/lọ thuốc nước, ống tiêm | 🟡 Khá | Nhầm đơn vị (ml/mg) | Đọc nhãn; đơn vị luôn để người xác nhận |
| 8 | **Kết quả xét nghiệm** (bảng số) | 🟢 Tốt | Đọc nhầm số | Trích xuất số + khoảng tham chiếu, **không diễn giải bệnh** |
| 9 | Sổ khám bệnh (nhiều trang) | 🟡 Trung bình | Chữ bác sĩ, nhiều trang | Cho chụp nhiều trang, xử lý từng trang, gộp lại |
| 10 | **Mặt máy đo** (huyết áp, đường huyết, nhiệt kế, cân) | 🟢 Tốt | Nhầm số trên/dưới | Chỉ đọc số, **không nhận xét cao/thấp** (ngưỡng tĩnh trong app xử lý) |
| 11 | **Giọng nói** | 🟡 Cần test | Giọng vùng miền, người già nói chậm/khó | Live API + fallback STT; luôn có nhập tay |
| 12 | **Nhập tay** | 🟢 Luôn có | — | **Đường thoát bắt buộc cho MỌI loại input** |
| 13 | Ảnh chụp màn hình (đơn điện tử, tin nhắn bác sĩ) | 🟢 Tốt | Thấp | Xử lý như #1 |
| 14 | File PDF (kết quả gửi email) | 🟢 Tốt | Thấp | Cho upload file, không chỉ ảnh |
| 15 | **Thuốc đông y / thực phẩm chức năng** | 🟠 Hạn chế | Không có hoạt chất chuẩn → **không kiểm tra tương tác được** | Cho ghi nhận & nhắc giờ, nhưng **nói rõ: không kiểm tra được tương tác**. Không bịa thông tin |

## ☠️ Ranh giới đỏ: viên thuốc trần

**Vì sao cấm AI định danh viên thuốc rời:**
- Thuốc generic Việt Nam có **hàng trăm loại viên trắng, tròn, không mã dập** — nhìn giống hệt nhau.
- Cơ sở dữ liệu nhận diện viên thuốc theo mã dập (imprint) chủ yếu là **của Mỹ**, gần như vô dụng với thuốc VN.
- AI sẽ **luôn đưa ra một câu trả lời** kể cả khi không chắc → người già tin → uống nhầm thuốc → hậu quả nghiêm trọng.

### 📌 Cập nhật 11/08 — mỏ neo nhận diện là BAO BÌ, không phải viên
Thanh nêu: *vỉ thuốc kín thì không thấy viên, làm sao suggest?* → Nhận ra giả định ban đầu sai: người già cầm trên tay **cái vỉ/hộp**, và nhận ra thuốc bằng **màu vỏ + chữ + hình dáng bao bì**, chứ không phải bằng viên.
→ **Ảnh nhận diện chính = ảnh vỉ/hộp (mặt có chữ)**; ảnh viên chỉ là bổ sung. Chi tiết + luồng hướng dẫn chụp đúng mặt: [32-Pharmacy-Mode](32-Pharmacy-Mode.md) mục 3.

**Cách xử lý đúng (biến điểm yếu thành tính năng):**
```
Ảnh viên thuốc trần  ──✗──▶  KHÔNG dùng để AI trả lời "đây là thuốc gì"
                     ──✓──▶  Dùng làm ẢNH NHẬN DIỆN gắn vào thuốc ĐÃ xác nhận từ đơn
```
- Khi con cái nhập đơn xong → app nhắc: *"Chụp ảnh viên thuốc thật để ba mẹ dễ nhận ra"* → lưu vào `medications.photo_ref`.
- Ảnh này hiện **to** trên màn hình nhắc → bác C4 (không đọc được chữ) nhận đúng viên bằng mắt.
- Nếu người dùng cố chụp viên trần để hỏi "thuốc gì?": app trả lời trung thực — *"Con không dám đoán tên thuốc từ hình viên, dễ nhầm lắm. Bác chụp giúp con vỏ hộp hoặc toa thuốc nha."*

> Đây cũng là **câu trả lời rất mạnh khi giám khảo hỏi về an toàn AI**: biết chỗ nào KHÔNG được dùng AI cũng quan trọng như biết dùng ở đâu.

## 🟠 Vùng xám cần cẩn thận

| Tình huống | Xử lý |
|---|---|
| Ảnh mờ, thiếu sáng, chụp nghiêng | Kiểm tra chất lượng ảnh **phía client trước khi gửi** → yêu cầu chụp lại (tiết kiệm token + tăng độ chính xác) |
| Đơn của người khác (chụp nhầm) | Màn xác nhận hiển thị **to** tên bệnh nhân trên đơn + hỏi "Đơn này của ai trong nhà?" |
| Đơn cũ đã hết hạn | Đọc ngày trên đơn; nếu quá cũ → hỏi *"Đơn này từ {ngày}, có còn dùng không?"* |
| Nhiều thuốc trong 1 ảnh | Trích xuất mảng; mỗi thuốc xác nhận riêng |
| Ảnh không phải tài liệu y tế | AI trả `doc_type: "khác"` → báo nhẹ nhàng, không xử lý tiếp |
| Chữ nước ngoài (thuốc nhập) | Đọc tên latin; tra `med_catalog` theo hoạt chất |

## Nguyên tắc chung cho mọi input
1. **Luôn có nhập tay** song song — không loại input nào là bắt buộc.
2. **Kiểm tra chất lượng trước khi gửi AI** — ảnh mờ thì bảo chụp lại, đừng tốn token rồi trả kết quả rác.
3. **Không có input nào đi thẳng vào lịch uống thuốc** — tất cả phải qua màn xác nhận của người.
4. **Ghi lại mọi ca thất bại** (có sự đồng ý) → cải tiến prompt + đưa vào golden set ([25](25-AI-Prompts.md)).
5. Loại input mới muốn thêm → phải trả lời được: *"nếu AI đoán sai ở đây, hậu quả tệ nhất là gì?"* Nếu câu trả lời là "uống nhầm thuốc" → không cho AI quyết.
