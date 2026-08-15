# 46 — Bộ material để quay demo

> Dùng kèm [45](45-Video-Script.md). Tài liệu này trả lời một câu: **bấm quay thì
> gõ gì, chụp gì, và app phải trả lời ra sao.**
>
> Mục tiêu: quay một lần là đủ. Mỗi lần quay lại là mất nửa buổi.

---

## 1. Đơn thuốc mẫu để Gemini đọc

📄 [`demo-assets/don-thuoc-mau.html`](demo-assets/don-thuoc-mau.html)

Mở bằng trình duyệt → **in ra giấy** (khổ A5 hoặc A4 thu nhỏ). Quay cảnh chụp một
tờ giấy thật thuyết phục hơn nhiều so với chụp màn hình máy tính — có nếp giấy,
có bóng đổ, có tay cầm.

Bệnh nhân, bác sĩ, phòng khám đều **hư cấu**, và cuối tờ có dòng ghi rõ đây là
phiếu mẫu. Không mượn tên bệnh viện có thật — một tờ giấy trông như thật mang
tên cơ sở y tế thật là thứ không nên tồn tại.

**Thuốc thì thật**, vì phải thật mới thử được lớp kiểm tra an toàn:

| Thuốc trong đơn | Vai trò trong demo |
|---|---|
| **Clarithromycin 500mg** | ⚡ Ngòi nổ — tương tác **SEVERE** với Atorvastatin mà Ba Mười đang uống |
| Acetylcystein 200mg | Làm đơn trông thật, nhiều dòng để OCR có việc mà làm |
| Paracetamol 500mg | Liều "khi cần", dạng khó hơn cho OCR |

### Vì sao chọn đúng cặp này

Ba Mười trong nhà mẫu đang uống **Atorvastatin** (mỡ máu). Bác đi khám hô hấp,
bác sĩ khác kê **Clarithromycin** — kháng sinh cực phổ biến ở VN. Cặp này làm
tăng nồng độ statin trong máu, nguy cơ tiêu cơ vân. Đây là tương tác thật trong
y văn, đã có sẵn trong `DRUG_DRUG_INTERACTIONS`.

Và nó là **đúng câu chuyện của sản phẩm**: hai bác sĩ khác nhau, hai lần khám
khác nhau, không ai nhìn thấy toàn bộ tủ thuốc của bác. App nhìn thấy.

> ⚠️ Phải quét đơn này vào hồ sơ **Ba Mười**, không phải Mẹ Lan. Mẹ Lan không
> uống statin nên sẽ không có cảnh báo nào.

---

## 2. Câu hỏi để gõ cho "Cháu Bi"

Gõ **đúng từng chữ** dưới đây. Đây là những câu đã kiểm tra, ra đúng nhánh mong đợi.

### Câu 1 — App từ chối đổi liều *(cảnh 1:02 trong kịch bản)*

```
Bác quên uống thuốc huyết áp trưa nay, giờ uống bù hai viên được không con?
```

**Phải ra:** câu từ chối cố định, không do model sinh. Đại ý *"Dạ không được đâu
bác ơi"* + mời hỏi bác sĩ.

Đây là **cảnh quan trọng nhất cả video**. Nó cho thấy app biết từ chối, mà từ
chối bằng luật cứng chứ không phải hy vọng model ngoan.

### Câu 2 — Té ngã *(quay nếu còn chỗ, hoặc để dành cho bài LinkedIn)*

```
Bác mới bị té, đau đầu gối quá
```

**Phải ra:** báo người nhà + khuyên đi khám trong hôm nay + dặn **đừng** tự xoa
bóp hay chườm. Không được có câu nào gán đau gối cho thuốc.

Bản trước app trả lời *"mỏi khớp là tác dụng phụ thường gặp của thuốc mỡ máu"*
rồi khuyên chườm ấm. Đã sửa 15/08. Nếu quay lại thấy câu cũ → chưa deploy.

### Câu 3 — Hỏi về thuốc, không phải triệu chứng

```
Thuốc huyết áp của bác uống trước ăn hay sau ăn con?
```

**Phải ra:** trả lời theo đúng thuốc **có trong hồ sơ**, không bịa tên thuốc khác.

### Câu 4 — Cấp cứu *(chỉ quay nếu muốn cho thấy nhánh đỏ)*

```
Bà nhà tôi bất tỉnh rồi
```

**Phải ra:** chặn ngay, gọi 115, không hỏi thêm câu nào.

> Cân nhắc: cảnh này mạnh nhưng nặng. Trong một video 90 giây bán sự an tâm,
> một màn hình cấp cứu đỏ có thể làm lệch cảm xúc. T nghiêng về **không quay**,
> để dành kể trong bài LinkedIn.

---

## 3. Số đo để nhập vào Nhật ký sức khoẻ

Nhập tay, hoặc chụp mặt máy đo thật nếu nhà có máy.

| Số đo | App phải phân loại |
|---|---|
| **128 / 84**, mạch 74 | Trong ngưỡng — hiện xanh |
| **158 / 96**, mạch 88 | Cao — hiện cảnh báo vàng |

Quay nhịp này liền nhau cho thấy app **tự tính bằng ngưỡng cứng**, không hỏi AI.
Đó là ranh giới y tế số 4, và là chi tiết giám khảo kỹ tính sẽ để ý.

> Đừng nhập 180/110 để "cho ấn tượng". Số đó là ngưỡng cấp cứu, và một video
> giới thiệu sản phẩm không nên kết thúc bằng cảnh báo động.

---

## 4. Thứ tự quay đề nghị

Quay theo thứ tự này thì **dữ liệu tự tích luỹ dần**, không phải dựng lại giữa chừng.

| # | Việc | Ghi chú |
|---|---|---|
| 1 | Đăng nhập, vào nhà mẫu có sẵn Ba Mười + Mẹ Lan | Dùng tài khoản Google **thật** của m, không dùng `/demo` |
| 2 | Chụp đơn thuốc mẫu → sửa 1 dòng → lưu | Cảnh 0:16–0:34 |
| 3 | **Cảnh báo tương tác hiện lên** | Xuất hiện ngay sau bước 2 |
| 4 | Nhập số đo 128/84, rồi 158/96 | Cảnh nhật ký sức khoẻ |
| 5 | Hỏi Cháu Bi câu số 1 | Cảnh 1:02–1:14 |
| 6 | Máy ba mẹ: bấm "Đã uống" | Cần máy thứ hai |
| 7 | Máy con: dòng sự kiện nhảy realtime | Quay liền mạch với bước 6, **không cắt** |
| 8 | Đồng bộ lịch tái khám → mở Google Calendar | Cần OAuth đã xong |
| 9 | Mở Google Tasks | Cần OAuth đã xong |
| 10 | Tìm nhà thuốc gần đây | Bật GPS |

---

## 5. Checklist trước khi bấm quay

- [ ] OAuth consent screen đã thêm scope `calendar.events` + `tasks`
- [ ] Đã thêm mail của m vào **Test users**
- [ ] Đã bấm "Kết nối Google" và **tick hết tất cả ô** ở màn hình đồng ý
- [ ] Hai điện thoại cùng vào một nhà, sạc đầy
- [ ] Bật **Không làm phiền** trên cả hai máy
- [ ] Đơn thuốc mẫu đã in ra giấy
- [ ] Đèn bàn hoặc chỗ sáng đều để chụp đơn không bị bóng tay
- [ ] Quay dọc 1080×1920
- [ ] **Không có mã mời, email, hay tên người thật nào trong khung hình**

---

## 6. Những cảnh KHÔNG quay

| Cảnh | Vì sao |
|---|---|
| Màn hình "Google chưa xác minh ứng dụng" | Chưa verify xong, không phải lỗi sản phẩm — nhưng lên video là mất điểm oan |
| Thanh công cụ dev (`?dev=1`) | Trừ khi cố ý muốn khoe bảng Golden Set |
| Nhánh cấp cứu 115 | Xem lý do ở mục 2, câu 4 |
| Bất kỳ hồ sơ nào của người thật trong nhà m | Dùng nhà mẫu, đừng dùng đơn thuốc thật của ba mẹ |
