# 27 — Sổ rủi ro & Phương án dự phòng (v1)

> Mỗi rủi ro đều có **phương án B**. Nguyên tắc xuyên suốt: *không có rủi ro nào được phép làm hỏng bài nộp* — chỉ được phép làm bài nộp bớt hoàn hảo.

## 🔴 Rủi ro cao

| # | Rủi ro | Dấu hiệu sớm | Phương án dự phòng |
|---|---|---|---|
| R1 | **Trích xuất đơn viết tay kém chính xác** | Golden set cho kết quả thấp ở nhóm chữ viết tay | ① Luôn có **nhập tay** song song ② Khuyến khích chụp **túi thuốc nhà thuốc** (chữ in, dễ đọc) ③ Màn xác nhận biến điểm yếu thành **điểm mạnh về an toàn** — kể thẳng trong demo: "AI đề xuất, người xác nhận" |
| R2 | **Live API tiếng Việt chưa tốt** (giọng người già, vùng miền) | Test sớm thấy nhận nhầm nhiều | Fallback **STT → Gemini text → TTS** đã thiết kế sẵn ([21](21-UI-Exploration.md)); nếu vẫn kém → chuyển trợ lý giọng nói sang tính năng phụ, không đưa lên đầu demo |
| R3 | **Play Console review chậm / không kịp** | Chưa được duyệt sau ~5 ngày làm việc | Điểm Deploy **+10 vẫn lấy đủ bằng web trên Cloud Run**. Android chuyển thành "đã build, đang chờ duyệt" trong phần roadmap. **→ Vì vậy phải đăng ký Play Console NGAY ngày đầu** |
| R4 | **Ôm quá nhiều tính năng, không kịp 30/08** | Hết tuần 2 mà luồng ①②③ chưa xong | Bám **thứ tự ưu tiên demo** ([22](22-Business-Model.md) mục 9), cắt từ dưới lên. Thà 3 tính năng hoàn thiện còn hơn 10 tính năng dở |
| R5 | **Không đủ người dùng thật** → mất cơ hội Gold | Sau 5 ngày vẫn <3 gia đình | Bắt đầu từ **gia đình mình ngay ngày đầu** ([26](26-User-Testing-Metrics.md)); giảm mục tiêu số lượng, tăng chiều sâu câu chuyện |

## 🟠 Rủi ro trung bình

| # | Rủi ro | Phương án |
|---|---|---|
| R6 | **Security rules lỏng** do AI sinh mặc định | Checklist bắt buộc trong [23](23-Security-Privacy.md); test bằng Rules Playground **trước khi mời người dùng thật** |
| R7 | Chi phí AI tăng vọt ngày chấm bài | 7 tầng kiểm soát + trần chi tiêu + degradation ([24](24-Scale-Cost-Control.md)) |
| R8 | Mất Starter Tier (bị đòi thẻ) | Dùng account **chưa từng publish app** AI Studio; thử incognito ([04](04-Huong-dan-Build-Deploy.md)) |
| R9 | Ba mẹ không dùng được app → không có dữ liệu thật | Con cái setup hộ 100% ([21](21-UI-Exploration.md)); có chế độ tracking-lite; đích thân hướng dẫn vòng đầu |
| R10 | AI đưa thông tin y tế sai (bịa tương tác, sai công dụng) | Rào an toàn trong mọi prompt ([25](25-AI-Prompts.md) mục 0); "không chắc thì bỏ qua"; mọi cảnh báo kết bằng "hỏi bác sĩ"; disclaimer thường trực |
| R11 | Song ngữ làm chậm tiến độ | Làm i18n **từ đầu** (rẻ), nhưng nếu gấp thì bản EN chỉ cần phủ **luồng demo chính** trước |
| R12 | Video demo quá 2 phút | Viết kịch bản & bấm giờ **trước khi quay**; ưu tiên 4 cảnh lõi ([17](17-Product-Spec.md) mục 11) |

## 🟡 Rủi ro thấp (theo dõi)

| # | Rủi ro | Ghi chú |
|---|---|---|
| R13 | Tên app trùng/không đăng ký được | Kiểm tra tên trên Play Store & tên miền **trước khi** làm logo |
| R14 | AI Studio thiếu tính năng cần (offline cache, background job) | Kiểm tra sớm ở P0; có thể thay bằng cách đơn giản hơn |
| R15 | Link AI Studio/video/LinkedIn để chế độ riêng tư | Checklist nộp bài ([09](09-Nop-bai-Checklist.md)) — kiểm bằng cửa sổ ẩn danh |
| R16 | Lỡ mốc "200 bài nộp sớm" (+3đ) | Nộp bản nháp sớm rồi cập nhật dần |

## ⚖️ Rủi ro đạo đức/pháp lý (không được phép sai)

| # | Rủi ro | Ràng buộc cứng |
|---|---|---|
| E1 | App bị hiểu là công cụ **chẩn đoán/kê đơn** | Không bao giờ gợi ý liều; không chẩn đoán; mô tả sản phẩm & mô tả trên Play đều dùng ngôn ngữ "tổ chức & hiểu thông tin y tế" |
| E2 | Dữ liệu y tế người thân bị dùng khi họ chưa biết | Buộc xác nhận có sự đồng ý; app của ba mẹ có màn "ai đang xem thông tin của tôi" ([23](23-Security-Privacy.md) mục 6) |
| E3 | Rò rỉ dữ liệu giữa các gia đình qua kho dùng chung | Kho chung **phi định danh 100%** by design |
| E4 | Dùng ảnh/câu chuyện người dùng trong bài nộp mà chưa xin phép | Xin đồng ý bằng tin nhắn, lưu bằng chứng; che thông tin cá nhân ([26](26-User-Testing-Metrics.md)) |

## 🔍 Rà soát định kỳ
Mỗi 3 ngày, Antigravity cập nhật trạng thái từng rủi ro vào [19](19-Decision-Log.md): *chưa xảy ra / đang xảy ra / đã xử lý*. Rủi ro mới phát sinh → thêm vào bảng này.
