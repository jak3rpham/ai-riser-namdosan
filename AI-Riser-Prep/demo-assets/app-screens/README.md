# Ảnh tham chiếu giao diện — dùng cho AI sinh ảnh / dựng motion

Chụp ngày 16/08/2026 từ bản đã deploy, ở **2x DPI**. Toàn bộ là giao diện thật
với dữ liệu thật, không phải mockup vẽ tay.

Chụp lại bất cứ lúc nào bằng `scripts/` — xem cuối file.

## Có gì trong đây

| File | Khổ | Nội dung |
|---|---|---|
| `01-trang-chao.png` | 1440×900 | Trang chào, chọn vai con cái / ba mẹ |
| `02-app-con-tong-quan.png` | 1440×900 | App Con — thanh điều hướng trái, ba ô thống kê, kiểm tra an toàn |
| `03-app-con-don-thuoc.png` | 1440×900 | Màn quét đơn thuốc + tủ thuốc |
| `04-app-con-chi-so.png` | 1440×900 | Nhật ký huyết áp / đường huyết |
| `05-app-con-kieng-an.png` | 1440×900 | Cảnh báo kiêng ăn theo đơn |
| `06-app-bame-toi-la-ai.png` | 390×844 | Màn "trong nhà mình bác là ai" |
| `07-app-bame-hom-nay.png` | 390×844 | **Màn chính app Ba Mẹ** — nút to, 4 chấm cữ |
| `08-app-bame-tu-thuoc.png` | 390×844 | Danh sách thuốc |
| `09-app-bame-chau-bi.png` | 390×844 | Trợ lý Cháu Bi |
| `10-app-bame-ho-so.png` | 390×844 | Hồ sơ: dị ứng, bệnh nền |
| `11-app-bame-man-nghe.png` | 390×844 | **Màn hình nói** — nền tối, vòng tròn 176px |
| `12-hai-man-hinh.png` | 1440×900 | Hai giao diện cạnh nhau |

Ba ảnh đáng dùng nhất khi cần asset khớp app: **07**, **11**, **02**.

## Bảng màu — lấy thẳng từ `src/index.css`

Đưa nguyên khối này cho AI sinh ảnh, đừng để nó tự đoán màu từ ảnh nén.

```
Nền              #F5F7FB   xám xanh rất nhạt
Cam chủ đạo      #FF6B4B   → gradient 135° tới #FF8E53
Cam nhạt         rgba(255,107,75,0.08)
Chữ đậm          #0F172A
Chữ phụ          #475569
Chữ mờ           #64748B
Xanh lá (an toàn) #059669
Vàng (cảnh báo)  #D97706
Đỏ (cấp cứu)     #DC2626
Xanh dương       #0284C7   → gradient 135° tới #38BDF8 (màn hình nói)
Nền màn nói      gradient 180° #0F172A → #1E293B
```

**Thẻ kính:** nền trắng 65% + `backdrop-blur(24px)`, viền trắng 85%,
đổ bóng `0 12px 32px rgba(31,38,135,0.07)`, bo góc 26px.

**Nền có ba khối mờ** (blob) màu hồng đào / xanh da trời / vàng nhạt, blur
70–80px, trôi rất chậm. Đây là thứ tạo cảm giác "liquid glass" của app.

## Chữ

- Tiêu đề: **Be Vietnam Pro** 800
- Thân bài: **Plus Jakarta Sans** 400–800
- Thang cỡ chữ: 11 · 12 · 13 · 14 · 16 · 18 · 20 · 23 · 26 · 32
- Bo góc: 8 · 12 · 16 · 20 · 26 · 32 · 99 (viên thuốc)

⚠️ Font phải có subset **vietnamese**. Outfit từng được dùng và làm vỡ chữ
giữa từ vì thiếu dải U+1EA0–U+1EF1 (ạ ế ộ ố ờ ứ ừ ự).

## Nhắc cho người viết prompt sinh ảnh

- Giọng hình ảnh: **ấm, gia đình, sáng sủa** — không phải "y tế lâm sàng".
  Không dùng xanh bệnh viện, không ống nghe, không blouse trắng.
- Nhân vật nếu có: người Việt, ông bà 65–75 và con cái 30–40.
- Cam là màu của hành động và sự quan tâm, KHÔNG phải màu cảnh báo. Cảnh báo
  dùng vàng, cấp cứu dùng đỏ.
- Tránh vẽ chữ tiếng Việt trong ảnh sinh ra — AI gần như luôn sai dấu. Cần chữ
  thì chèn sau bằng phần mềm dựng.

## Chụp lại

```bash
npm run dev            # cần dev server chạy ở cổng 3000
node scripts/chup-giao-dien.mjs AI-Riser-Prep/demo-assets/app-screens
```

Script tự dựng một nhà mới rồi khai hồ sơ và nhập một đơn thuốc, nên ảnh luôn
có nội dung thật. Nó ghi vào Firestore production — xoá nhà đó sau khi chụp.
