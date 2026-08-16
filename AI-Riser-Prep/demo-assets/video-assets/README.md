# Asset cho video dự thi — sẵn sàng dùng

**Mọi thứ trong đây là 16:9 ngang, 1920×1080.**

Mỗi thư mục = một asset. Mở thư mục là có đủ: `prompt.txt` để dán, và ảnh
tham chiếu để đính kèm. Không phải đi tìm ở đâu khác.

---

## Cách dùng

1. Mở thư mục asset cần làm.
2. Mở `prompt.txt`, copy khối **PROMPT**.
3. Vào công cụ sinh ảnh, **đính kèm hết ảnh .png trong cùng thư mục đó**.
4. Dán prompt, thêm câu: *"Bám đúng màu và chất liệu trong ảnh đính kèm."*
5. Đọc phần **DẶN THÊM** trước khi chốt — trong đó có mấy cái bẫy đã biết.

---

## Danh sách asset

| Thư mục | Mốc giây | Cần sinh bằng AI? | Ảnh kèm |
|---|---|---|---|
| `01-hook-phong-dem` | 0:00 – 0:05 | ✅ | bảng màu |
| `02-hook-dien-thoai-sang` | 0:05 – 0:09 | ✅ | bảng màu |
| `03-icon-dung-len` | 0:09 – 0:16 | ✅ | **icon app** + bảng màu |
| `04-canh-dong` | 1:24 – 1:30 | ✅ | icon app |
| `05-ba-me-va-con` | tuỳ chọn | ✅ | bảng màu + màn hình app |
| `_plate-16-9` | 0:16 – 1:24 | ❌ **đã xong** | — |

`_plate-16-9/` là ảnh app thật đã ghép sẵn vào khung ngang 1920×1080 trên đúng
nền của app. Không cần AI, không cần sửa — kéo thẳng vào timeline.

| Plate | Dùng cho |
|---|---|
| `plate-01-hom-nay.png` | Màn chính app Ba Mẹ, có tiêu đề sẵn |
| `plate-02-man-nghe.png` | Màn hình nói, nền tối — điểm nhấn thị giác mạnh nhất |
| `plate-03-hai-may.png` | Cảnh "hai máy nối nhau" (0:50) |
| `plate-04-app-con.png` | App Con, tổng quan |
| `plate-05-kieng-an.png` | Cảnh cảnh báo tương tác thuốc (1:02) |

`_ref/` chứa bản gốc của bảng màu và icon, dùng lại khi cần asset mới.

---

## Ba điều quyết định asset có khớp app hay không

**1. Đừng để AI vẽ chữ tiếng Việt.** Nó gần như luôn sai dấu — "uống" thành
"uóng", "đúng giờ" thành "đúng gio". Mọi chữ trong video chèn ở khâu dựng, bằng
**Be Vietnam Pro** (font này có subset vietnamese, đã kiểm).

**2. Cam là màu của hành động và sự quan tâm, không phải màu cảnh báo.**
Cảnh báo dùng vàng `#D97706`, cấp cứu dùng đỏ `#DC2626`. Sinh ra một cảnh cam
rực mang nghĩa nguy hiểm là lệch hẳn ý sản phẩm.

**3. Không dùng ngôn ngữ hình ảnh y tế lâm sàng.** Không blouse trắng, không
ống nghe, không xanh bệnh viện, không hành lang bệnh viện. Đây là app gia
đình. Ranh giới đó cũng đúng với sản phẩm: app **không** chẩn đoán bệnh.

---

## Dựng lại khi giao diện đổi

```bash
npm run dev
node scripts/chup-giao-dien.mjs AI-Riser-Prep/demo-assets/app-screens
node scripts/dung-plate-video.mjs \
     AI-Riser-Prep/demo-assets/app-screens \
     AI-Riser-Prep/demo-assets/video-assets/_plate-16-9
```

---

## Còn thiếu

Cảnh **quay màn hình thật** (0:16 – 1:24) — plate ở trên là ảnh tĩnh, dùng để
chèn và làm nền. Đoạn thao tác thật vẫn phải quay: chụp đơn thuốc, Gemini đọc
ra từng dòng, bấm "đã uống", Google Calendar hiện sự kiện. Danh sách cảnh cần
quay nằm ở [45](../../45-Video-Script.md) mục "Danh sách cảnh phải quay màn hình".
