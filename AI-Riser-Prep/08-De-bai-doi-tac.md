# 07b — Đề bài tham khảo từ ĐỐI TÁC (rất quý cho brainstorm)

> Nguồn: Deck chính thức *"AI Riser Vietnam — Đề bài gợi ý từ đối tác chương trình"* (link "HERE" trên trang sự kiện).
> Đây là **11 bài toán thực tế** do các đối tác (NIC, SIHUB, DISSC, các Sở/Trung tâm ĐMST, sàn công nghệ, đơn vị du lịch...) cung cấp. Bạn **không bắt buộc** chọn — nhưng đây là "mỏ vàng" vì: (1) vấn đề có thật, có người dùng thật → dễ ghi điểm **impact** & **user engagement**; (2) có thể được đối tác để mắt.

> **Lưu ý chung của BTC:** Bạn có thể tự do nghiên cứu & chọn bất kỳ đề nào trong 10 chủ đề chính thức (xem [07-Themes-goi-y.md](07-Themes-goi-y.md)). Tài liệu này dành cho ai **chưa có ý tưởng** và muốn thử giải một đề bài cụ thể. Mỗi đề có thể giải **tổng thể** hoặc chỉ **một thách thức riêng lẻ**.

---

## #1 — Quản lý và xử lý thông tin
- **Mong muốn:** Giải pháp xử lý bài toán tổng thể về quản lý & xử lý thông tin, hoặc từng vấn đề riêng lẻ.
- **Bối cảnh:** Đơn vị hành chính nhà nước vận hành cổng dịch vụ công, quản lý nhiều kênh (website, mạng xã hội, email) để hỗ trợ khách hàng.
- **Thách thức:**
  - Tin nhắn từ nhiều kênh xử lý riêng lẻ, không có đầu mối quản lý tập trung.
  - Ngoài giờ hành chính / khi nhân sự vắng, người hỏi không được phản hồi kịp thời.
  - Câu hỏi lặp lại nhiều nhưng vẫn trả lời thủ công tốn thời gian.
  - Gửi & cập nhật thông tin đến nhiều người qua nhiều kênh vẫn thủ công, dễ bỏ sót.
  - Cổng dịch vụ nhiều thông tin nhưng cấu trúc phức tạp, doanh nghiệp khó tra cứu.
- 💡 *Hướng AI:* Chatbot RAG trả lời 24/7 gom đa kênh (Gemini + Firebase); tóm tắt & định tuyến câu hỏi.

## #2 — Quản lý kết nối và liên lạc
- **Mong muốn:** Tự động trích xuất dữ liệu đầu vào, tra cứu nguồn công khai, tổng hợp thành **hồ sơ chuẩn hoá** sẵn dùng.
- **Bối cảnh:** Đơn vị/DN tham gia nhiều hội nghị, hội thảo, triển lãm → nhiều đầu mối liên lạc cần thu thập & khai thác.
- **Thách thức:**
  - Tra cứu & tổng hợp thông tin 1 đối tượng mất 30–60 phút.
  - Thông tin phân tán, không chuẩn định dạng, khó chia sẻ & lưu trữ.
  - Rào cản ngôn ngữ khi tra cứu đối tác/DN nước ngoài.
  - Không có kho dữ liệu tái sử dụng khi đối tượng quay lại.
- 💡 *Hướng AI:* Gemini trích xuất & chuẩn hoá danh thiếp/hồ sơ; auto-enrich từ web; lưu Google Sheets/Firebase.

## #3 — Tra cứu & so sánh thông tin
- **Mong muốn:** Tổng hợp dữ liệu đa nguồn **real-time**, trình bày **bảng so sánh trực quan** theo tiêu chí người dùng chọn.
- **Bối cảnh:** DN (nhất là FDI) cân nhắc đầu tư vào khu công nghệ / tỉnh thành → cần so sánh nhiều phương án (chính sách, công nghệ...). Dữ liệu phân tán, thay đổi thường xuyên.
- **Thách thức:**
  - Thông tin chính sách ưu đãi rải rác, không có nguồn tổng hợp/so sánh.
  - Mỗi lần DN hỏi, cán bộ tra cứu lại từ đầu vì chính sách đổi liên tục.
  - Phản hồi chậm ảnh hưởng quyết định & ấn tượng nhà đầu tư.
  - Tổng hợp thủ công dễ thiếu sót, trình bày chưa ấn tượng (chủ yếu văn bản).
- 💡 *Hướng AI:* Dashboard so sánh động; Gemini tóm tắt chính sách; Maps cho dữ liệu vị trí khu CN.

## #4 — Tự động tạo hồ sơ doanh nghiệp (Company Profile)
- **Mong muốn:** Tự động tổng hợp thông tin công khai → tạo **Company Profile chuẩn hoá**, giúp cán bộ nắm bắt & theo dõi DN nhanh.
- **Bối cảnh:** Trung tâm ĐMST thường xuyên tiếp nhận DN mới; cần tìm nhanh lĩnh vực, quy mô, sản phẩm, thị trường. Hiện làm thủ công từ Google, LinkedIn, website, cổng ĐKKD.
- **Thách thức:**
  - Tra cứu thủ công 1 DN mất nhiều thời gian, dễ quá tải.
  - Thông tin phân tán, không chuẩn định dạng, khó lưu trữ & chia sẻ nội bộ.
  - Tìm hiểu DN nước ngoài khó khăn.
  - Không có CSDL tập trung → tra cứu lại từ đầu khi DN quay lại.
- 💡 *Hướng AI:* Gemini + web/grounding tự sinh profile 1 trang; xuất Google Docs/Sheets.

## #5 — Số hoá quy trình cho thuê không gian
- **Mong muốn:** Tự động hoá luồng **yêu cầu → báo giá → phê duyệt**, cung cấp trạng thái minh bạch, theo dõi được cho các bên.
- **Bối cảnh:** Đơn vị cho thuê không gian hội nghị/sự kiện có quy trình nội bộ nhiều bước thủ công (tiếp nhận, báo giá, phê duyệt, ký kết).
- **Thách thức:**
  - Xác nhận thông tin, đối chiếu quyết định/quy định để tính báo giá làm thủ công → tốn công, dễ sai.
  - Luân chuyển hợp đồng qua các bộ phận (kế toán kiểm tra, ký nháy) gây độ trễ lớn; chưa tận dụng hạ tầng chữ ký số.
- 💡 *Hướng AI:* Workflow tự động + quote generator; tích hợp Workspace (Gmail/Calendar/Docs) & e-signature.

## #6 — Kết nối cung – cầu công nghệ
- **Mong muốn:** Giúp DN **mô tả đúng nhu cầu** & nhanh chóng tiếp cận công nghệ/chuyên gia/đối tác phù hợp.
- **Bối cảnh:** Nền tảng **techport.vn** quản lý hàng nghìn gian hàng công nghệ, thiết bị, chuyên gia & nhu cầu.
- **Thách thức:**
  - Nhu cầu mô tả không chuẩn hoá → khó tìm kiếm.
  - Tìm theo từ khoá chưa sát nhu cầu thực.
  - Thiếu công cụ so sánh/đánh giá giữa nhiều lựa chọn.
  - Khó ghép 2 nhóm đối tượng có tiêu chí khác nhau & cá nhân hoá đề xuất.
- 💡 *Hướng AI:* Semantic matching (embeddings) + Gemini chuẩn hoá nhu cầu; recommendation.

## #7 — Chuẩn hóa dữ liệu sự kiện
- **Mong muốn:** **Dashboard** tổng hợp dữ liệu đa nguồn, hỗ trợ tìm kiếm & khai thác; hoặc giải pháp chuẩn hoá dữ liệu.
- **Bối cảnh:** Đơn vị tổ chức hàng trăm hội thảo/đào tạo/kết nối mỗi năm → lượng lớn dữ liệu DN, chuyên gia, diễn giả, khách mời.
- **Thách thức:**
  - Tài liệu lưu trong nhiều file Excel cấu trúc khác nhau.
  - Dữ liệu lớn nhưng khó tìm, cập nhật, khai thác.
  - Hạn chế cơ chế kết nối & vận hành hợp tác.
- 💡 *Hướng AI:* Gemini chuẩn hoá schema từ Excel lộn xộn → Sheets/DB; dashboard tìm kiếm.

## #8 — Hỗ trợ lựa chọn công nghệ phù hợp
- **Mong muốn:** Giúp DN **đánh giá, so sánh** phương án công nghệ theo nhiều tiêu chí, ra quyết định đầu tư hiệu quả mà **không cần chuyên môn sâu**.
- **Bối cảnh:** Qua **Sàn Giao dịch công nghệ TP.HCM**, DN có nhu cầu đổi mới/chuyển đổi số nhưng chưa xác định công nghệ phù hợp quy mô, tài chính, mục tiêu.
- **Thách thức:**
  - Sàn nhiều giải pháp nhưng chưa có công cụ so sánh/đánh giá.
  - DN thiếu chuyên môn tự phân tích độ tương thích & hiệu quả.
  - Dễ quyết định cảm tính → lãng phí.
  - Chưa có cơ chế kết nối hiệu quả DN – Chuyên gia – Nhà cung cấp.
- 💡 *Hướng AI:* Advisor hỏi–đáp bằng Gemini → gợi ý công nghệ + bảng so sánh + ước tính chi phí.

## #9 — Theo dõi và hỗ trợ Startup
- **Mong muốn:** **Dashboard** thống kê hồ sơ & tiến độ; **AI tự cảnh báo nhóm rủi ro**, tóm tắt tình hình, gợi ý hỗ trợ → phát hiện sớm vấn đề.
- **Bối cảnh:** Đơn vị quản lý nhiều startup trong chương trình ươm tạo/tăng tốc, KPI & lộ trình khác nhau; báo cáo định kỳ nhưng phân tán.
- **Thách thức:**
  - Khó nắm nhanh tình trạng & tiến độ từng startup.
  - Khó phát hiện sớm dấu hiệu chậm/rủi ro để can thiệp.
  - Dữ liệu chưa tối ưu để khai thác cho quản trị & ra quyết định.
  - Thiếu hệ thống lưu trữ & phân loại tự động thông tin startup.
- 💡 *Hướng AI:* Gemini phân tích báo cáo → risk scoring + cảnh báo; dashboard tiến độ.

## #10 — Tối ưu lịch kết nối, theo dõi & đo lường (sự kiện DAVAS)
- **Mong muốn:** Giải quyết tổng thể bài toán kết nối – theo dõi – đo lường hiệu quả, hoặc từng phần.
- **Bối cảnh:** **DAVAS** — sự kiện thường niên về đầu tư khởi nghiệp ĐMST, kết nối startup với quỹ VC, angel, đối tác. Có Pitching, Business Matching 1:1, triển lãm, hội thảo, lễ ký kết.
- **Thách thức:**
  - Ghép nối thủ công, khó đúng "khẩu vị" & giai đoạn đầu tư.
  - Khó tối ưu lịch **Business Matching 1:1** quy mô lớn (dễ trùng, sai đối tượng).
  - Cần cơ chế theo dõi & duy trì kết nối sau sự kiện.
  - Dữ liệu hồ sơ startup/nhà đầu tư phân tán, chưa chuẩn hoá.
  - Chưa đo lường hiệu quả kết nối & tỷ lệ thành công thương vụ.
  - Khó cá nhân hoá lịch trình/hội thảo cho từng khách mời.
- 💡 *Hướng AI:* Matchmaking + scheduling optimizer; Gemini gợi ý cặp phù hợp; Calendar API.

## #11 — Chuyển đổi xanh trong du lịch
- **Mong muốn:** Theo dõi & phân tích dữ liệu tiêu thụ **năng lượng, nước, tài nguyên & phát thải** → đề xuất tối ưu, hỗ trợ xây **lộ trình du lịch xanh**, giảm phát thải.
- **Bối cảnh:** Du lịch chịu áp lực ô nhiễm, tiêu thụ năng lượng, cạn kiệt tài nguyên. Chuyển đổi xanh thành xu hướng nâng cạnh tranh & phát triển bền vững.
- **Thách thức:**
  - Thiếu công cụ đo lường liên tục năng lượng/nước/chất thải.
  - Khó xác định điểm lãng phí tài nguyên để ưu tiên cải thiện.
  - Thiếu dữ liệu chứng minh hiệu quả xanh (để lấy chứng nhận, tài trợ, truyền thông).
  - Áp lực từ chính sách & du khách tăng, nguồn lực/công cụ hạn chế.
- 💡 *Hướng AI:* Nhập hoá đơn/số liệu → Gemini phân tích & đề xuất; dashboard phát thải; báo cáo ESG tự động.

---

## 🧭 Nhận xét nhanh để chọn đề
- **Xu hướng chung của các đề đối tác:** đa phần là **B2G/B2B tooling** — chuẩn hoá dữ liệu, tổng hợp đa nguồn, matching, dashboard, chatbot hỗ trợ. Rất hợp với category **Business Utility (micro-SaaS)** và **ăn điểm impact** vì có "khách hàng" thật.
- **Dễ demo & có user thật:** #1 (chatbot dịch vụ công), #4 (company profile generator), #7 (chuẩn hoá Excel), #8 (tech advisor).
- **"Sexy" & khác biệt:** #11 (du lịch xanh), #10 (matchmaking sự kiện đầu tư).
- Khi brainstorm ([11-Brainstorm-y-tuong.md](11-Brainstorm-y-tuong.md)), có thể **ghép đề đối tác + theme chính thức** để vừa có impact vừa đúng sở thích của bạn.
