# 24 — Chịu tải, Chi phí & Giới hạn token (v1)

> Yêu cầu Thanh: *"limit token để khi nhiều người dùng cùng vô thì app vẫn handle được"*. Đặc biệt quan trọng vì **ngày chấm bài sẽ có nhiều giám khảo + cộng đồng vào cùng lúc** sau khi đăng LinkedIn.

## 1. Hình dung tải thực tế

| Kịch bản | Đặc điểm | Rủi ro chính |
|---|---|---|
| **Ngày chấm bài** ⚠️ | Nhiều giám khảo mở app trong vài giờ, phần lớn **thử chụp đơn thuốc** = đúng thao tác tốn AI nhất | Chạm rate limit Gemini → app "đứng" đúng lúc quan trọng nhất |
| Sau bài LinkedIn viral | Vài trăm–vài nghìn lượt trong 1–2 ngày | Chi phí tăng vọt; đăng ký ồ ạt |
| Vận hành thường ngày | Chủ yếu nhắc thuốc & xem dashboard | **~0 token** — không đáng lo |

> **Insight quan trọng:** tải AI của app này **bùng nổ theo sự kiện** (người mới thử), không theo số người dùng thường xuyên. Vì vậy chiến lược là: **bảo vệ đường trích xuất đơn thuốc** và **giữ cho mọi thứ khác không phụ thuộc AI**.

## 2. 🛡️ Nguyên tắc nền: chức năng lõi KHÔNG phụ thuộc AI
Nhắc thuốc, xác nhận đã uống, dashboard, lịch, tủ thuốc → **thuần Firestore + logic thường**. Dù AI sập hoàn toàn hay hết quota, **app vẫn chăm sóc được người dùng**. AI chỉ tham gia lúc *nhập dữ liệu mới* và *hỏi đáp*.
- Đây vừa là thiết kế chịu lỗi, vừa là **luận điểm mạnh khi pitch**: "hệ thống nhắc thuốc không bao giờ phụ thuộc vào việc AI có online hay không."

## 3. Thang suy giảm có kiểm soát (graceful degradation)

```
Mức 1 — Bình thường:   AI đầy đủ (trích xuất + giải thích + trợ lý giọng nói)
Mức 2 — Tải cao:       Trích xuất vẫn chạy · giải thích lấy từ cache · tắt trợ lý giọng nói
Mức 3 — Quá tải/hết quota: Xếp hàng trích xuất ("đang xử lý, xong sẽ báo bác") + luôn có NHẬP TAY
Mức 4 — AI sập:        Toàn bộ tính năng chăm sóc vẫn chạy; chỉ ẩn nút AI + báo nhẹ nhàng
```
- Không bao giờ hiện lỗi kỹ thuật cho người già. Copy kiểu: *"Con đang bận xử lý một chút, bác chờ tí nha"*.

## 4. Kiểm soát chi phí & token — 7 tầng

| Tầng | Cách làm | Hiệu quả |
|---|---|---|
| **1. Cache dùng chung** | `med_catalog` (giải thích thuốc) + `interactions_cache` (tương tác thuốc & thức ăn), khóa theo hoạt chất + ngôn ngữ | Cao nhất — người dùng thứ N gần như **0 token** cho phần kiến thức |
| **2. Nén ảnh trước khi gửi** | Resize cạnh dài ~1500px, JPEG q~80 phía client | Giảm mạnh image token, tăng tốc |
| **3. Chọn model theo việc** | Flash cho trích xuất & giải thích; chỉ escalate model mạnh khi **confidence thấp** | Rẻ mà vẫn chính xác |
| **4. Structured output** | Ép JSON schema, giới hạn `max_output_tokens` | Không sinh văn dài lan man |
| **5. Quota theo người dùng** | Vd: 5 lần quét đơn/ngày, 10 phút giọng nói/ngày (bản dùng thử) | Chặn lạm dụng & tai nạn |
| **6. Trần chi tiêu toàn hệ thống** | Ngưỡng chi/ngày → tự chuyển sang Mức 2/3 ở mục 3 | **Không bao giờ cháy túi** |
| **7. Không tính lại thứ đã tính** | Giải thích/cảnh báo lưu vào document, không gọi lại mỗi lần mở | Tránh rò rỉ chi phí âm thầm |

## 5. Rate limiting (thiết kế cụ thể)
- **Theo người dùng:** token bucket lưu ở Firestore (`users/{uid}/quota`): số lượt còn lại + thời điểm nạp lại. Kiểm ở **server**, không phải client.
- **Theo gia đình:** trần chung để 1 nhà không tiêu hết quota của hệ thống.
- **Hàng đợi cho việc nặng:** trích xuất đơn đưa vào job đơn giản (Firestore doc trạng thái `pending → processing → done`) → UI hiện "đang xử lý", không giữ kết nối chờ.
- **Với lỗi 429/5xx từ Gemini:** retry **tối đa 2 lần, backoff lũy thừa + jitter**; hết thì chuyển sang Mức 3 (xếp hàng) chứ không báo lỗi đỏ.
- **Chống lạm dụng:** giới hạn kích thước/định dạng file; chặn tài khoản mới upload hàng loạt; CAPTCHA **không dùng** (rào cản người già) — thay bằng quota chặt.

## 6. Cấu hình hạ tầng

**Cloud Run:**
- `min-instances = 1` **trong giai đoạn chấm bài** (tránh cold start làm giám khảo chờ) → gỡ sau khi thi xong để tiết kiệm.
- `max-instances` đặt trần rõ ràng → chặn hóa đơn bất ngờ.
- Concurrency mặc định cao (app I/O-bound), timeout đủ cho lời gọi AI.

**Firestore:**
- **Doc tóm tắt dashboard** cho mỗi gia đình (`families/{fid}/summary/today`) → mở dashboard = **1 lần đọc**, không phải quét toàn bộ thành viên/liều.
- Cập nhật summary bằng trigger khi có thay đổi, không tính lại lúc đọc.
- Tạo index cho các truy vấn hay dùng; phân trang lịch sử.

**Ảnh:** lưu Storage, không nhét base64 vào Firestore.

## 7. Quan sát & cảnh báo (observability)
- Log mỗi lời gọi AI: loại việc, model, token vào/ra, thời gian, cache hit/miss, ẩn danh — **không log nội dung**.
- Bảng theo dõi: số lượt trích xuất/ngày · tỉ lệ cache hit · chi phí ước tính/ngày · tỉ lệ lỗi.
- Cảnh báo khi: chi phí ngày > ngưỡng · tỉ lệ lỗi > 5% · cache hit tụt bất thường.
- **Tỉ lệ cache hit chính là số liệu đẹp để đưa vào bài nộp** — chứng minh luận điểm "càng đông càng rẻ" ([22](22-Business-Model.md)).

## 8. 🎬 Playbook ngày chấm bài
- [ ] Bật `min-instances = 1` trước 1 ngày.
- [ ] Nạp sẵn `med_catalog` các thuốc phổ biến VN → giám khảo thử thuốc thường gặp là **cache hit, trả lời tức thì**.
- [ ] Chuẩn bị **tài khoản demo có sẵn dữ liệu đẹp** (đề phòng giám khảo không có đơn thuốc để chụp) + 2–3 ảnh đơn mẫu tải sẵn trong app.
- [ ] Nâng quota/ngày tạm thời cho giai đoạn chấm.
- [ ] Theo dõi bảng chi phí & lỗi mỗi ngày trong tuần cuối.
- [ ] Kiểm tra đường degradation: thử tắt AI xem app còn chạy đúng không.

## 9. Ước tính (khung — cần chốt bằng pricing thực tế khi build)
| Hạng mục | Ghi chú |
|---|---|
| Nhập 1 tài liệu | 1 lời gọi vision + (0–1) giải thích, phần lớn cache hit sau vài trăm người dùng đầu |
| Trợ lý giọng nói | **Đắt nhất/phút** → giới hạn phút/ngày; là nút chặn chi phí chính |
| Nhắc thuốc, dashboard | 0 token |
| Firestore/Storage/Cloud Run | Nhỏ ở quy mô cuộc thi; Thanh có sẵn ~7M credit GCP → không phải lo trong giai đoạn thi |

→ 🔲 **Việc cho Antigravity:** đo token thực tế của 10 lần trích xuất đầu tiên, ghi lại vào [19](19-Decision-Log.md) để chốt quota & ước tính chi phí thật.
