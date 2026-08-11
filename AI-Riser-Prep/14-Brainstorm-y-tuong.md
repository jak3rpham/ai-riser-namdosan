# 14 — Brainstorm ý tưởng (workspace)

## 🎯 Constraint đã chốt (từ thảo luận)
- **Impact thực tế** là ưu tiên số 1; dùng tối đa **Google ecosystem** (không external, không auth phức tạp → dễ thương mại hóa).
- **Daily-use:** gần gũi đời sống/công việc hằng ngày, user bật lên thường xuyên.
- **Cả Web + Android app** (web = tiện desktop; app = tiện điện thoại). Deploy: Cloud Run + Google Play.
- **Scalability** là điểm cộng lớn: mở rộng tính năng, user, và kinh tế (economic model).
- Điều kiện thuận: gói Google cao nhất + ~7M credit GCP → không lo limit; có nhóm user dùng thử thoải mái.
- Creativity = ý tưởng "chưa ai làm / chưa ai làm tốt" + UX/UI chỉn chu.

## 📐 Luật thiết kế bổ sung (rút từ critique vòng 1)
1. **Zero/low-input:** user không phải thao tác nhiều — dữ liệu tự chảy vào từ ecosystem API hoặc sinh ra trong app. Đặc biệt nếu nhắm người già.
2. **Input đồng nhất:** tránh app mà mỗi case là một kiểu dữ liệu rời rạc (dễ sai sót, không kiểm soát được chất lượng). Input cùng 1 dạng → task AI bounded → chính xác & cải thiện dần.
3. **Token economics:** phân tích AI nặng chỉ chạy 1 lần/1 loại; vận hành hằng ngày chủ yếu đọc dữ liệu đã cấu trúc (Firestore) → cost/user/ngày thấp, long-term bền.

## ❌ Ý tưởng đã loại (lưu lại lý do)
| Ý tưởng | Lý do loại |
|---|---|
| App về sách | Google không có access nguồn sách full-text (Books API chỉ có search/metadata/preview) → thiếu nguyên liệu lõi. |
| Maps "chặt hẻm" — tìm đường hẻm hợp phương tiện + traffic real-time | Đấu trực diện Google Maps (họ đã làm 80%); phức tạp dữ liệu. **Save for future.** |
| 🅰️ Lá Chắn (chống lừa đảo) | Vi phạm cả 3 luật trên: bắt user (kể cả người già) nhập ảnh/context/ghi âm thủ công; input ngoài quá nhiều & mỗi case một kiểu → phân tích rời rạc dễ sai; tốn token mỗi lần check → long-term không phù hợp. Giá trị xã hội tốt nhưng thiết kế không đạt. |

---

# 5 Ý TƯỞNG ỨNG VIÊN

## 🅰️ "Lá Chắn" — AI đồng hành chống lừa đảo hằng ngày
**Pitch:** Dán tin nhắn / link / SĐT / ảnh chụp màn hình / ghi âm cuộc gọi đáng ngờ → Gemini phân tích ngữ cảnh + Search grounding (tra tin lừa đảo mới nhất) → chấm điểm rủi ro, **giải thích bình dân vì sao là lừa đảo**, hướng dẫn xử lý. Cộng đồng báo cáo → Firestore thành DB lừa đảo real-time của VN.
- **Daily-use:** ai cũng nhận tin nhắn/cuộc gọi lạ gần như mỗi ngày; còn là app "check hộ ba mẹ".
- **Stack:** Gemini (multimodal: text/ảnh/audio) + Search grounding + Firestore + Auth; Android app = chia sẻ ảnh màn hình vào app cực tiện.
- **Impact:** lừa đảo online là vấn nạn quốc gia; bảo vệ người già/người ít rành công nghệ → Inclusive luôn.
- **Judge fit 🔥:** giám khảo có **CEO Chống Lừa Đảo (Hieu Ngo Minh)**; theme #5 chính thức của BTC.
- **"Chưa ai làm tốt":** các app hiện có (tra số, tra link) là DB tĩnh + tra cứu thủ công — chưa có AI phân tích *ngữ cảnh* đa phương thức + giải thích giáo dục.
- **Scalability:** browser extension, API cho ngân hàng/nhà mạng, gói doanh nghiệp (bảo vệ nhân viên), cảnh báo theo khu vực, "scam trend" dashboard.
- **Rủi ro:** cần xử lý false positive khéo; demo phải chọn case rõ ràng.

## 🅱️ "Ví Nhẹ" — Tài chính cá nhân tự động từ Gmail + ảnh
**Pitch:** App tự đọc **Gmail** (biên lai chuyển khoản, hóa đơn điện nước, đơn Shopee/Grab...) + chụp ảnh hóa đơn giấy → Gemini phân loại chi tiêu tự động → dashboard, ngân sách, cảnh báo, lời khuyên tiết kiệm cá nhân hóa. Không nhập tay.
- **Daily-use:** tiền là chuyện mỗi ngày; mở app xem "tháng này tiêu gì".
- **Stack:** **Workspace (Gmail) — tích hợp sâu đúng kiểu giám khảo GDE Workspace thích** + Gemini + Firestore + Sheets export.
- **Impact:** quản lý tài chính là pain phổ quát; app hiện có (Money Lover...) bắt nhập tay → 90% người bỏ cuộc.
- **"Chưa ai làm tốt":** tự động hóa từ email + AI phân loại tiếng Việt là khác biệt thật.
- **Scalability:** mục tiêu tiết kiệm, gia đình chung ví, tư vấn tài chính AI, freemium.
- **Rủi ro:** nhiều giao dịch VN qua SMS/app ngân hàng không qua email (bù bằng chụp màn hình); dữ liệu nhạy cảm → phải nói rõ "chỉ đọc dữ liệu của chính user" (điểm mạnh của kiến trúc AI Studio). ⚠️ Note: tư vấn *đầu tư* cụ thể thì né, chỉ làm phân loại & ngân sách.

## 🅲 "Sổ Y Bạ Nhà Mình" — Hồ sơ sức khỏe gia đình bằng AI
**Pitch:** Chụp đơn thuốc (kể cả viết tay), kết quả xét nghiệm, sổ khám → Gemini đọc & **giải thích bằng lời bình dân**, lưu thành hồ sơ sức khỏe từng thành viên gia đình (Firestore), nhắc lịch uống thuốc/tái khám (**Calendar/Tasks**), tìm nhà thuốc & bệnh viện gần (**Maps grounding**).
- **Daily-use:** nhắc thuốc hằng ngày; nhà có người già/trẻ nhỏ là dùng liên tục.
- **Stack:** Gemini vision + Calendar + Tasks + Maps + Firestore — combo 4 mảng, rất "sâu".
- **Impact:** theme #1 Healthcare; thu hẹp khoảng cách y tế thành thị–nông thôn (người quê không hiểu đơn thuốc); chăm sóc từ xa cho cha mẹ.
- **"Chưa ai làm tốt":** VN chưa có app hồ sơ y tế *gia đình* thân thiện; sổ khám giấy vẫn thống trị.
- **Scalability:** telehealth connect, xu hướng sức khỏe theo thời gian, nhắc tiêm chủng trẻ em, gói gia đình.
- **Rủi ro:** phải đóng khung "giải thích & tổ chức thông tin, không chẩn đoán"; OCR đơn viết tay cần demo cẩn thận.

## 🅳 "Trợ Lý Chốt Đơn" — Copilot cho người bán hàng online nhỏ lẻ
**Pitch:** Tiểu thương/người bán qua FB-Zalo-TikTok: chụp ảnh sản phẩm → Gemini sinh content bán + ảnh minh họa (Nano Banana); dán tin nhắn khách → AI soạn trả lời, ghi đơn tự động vào **Sheets**; cuối ngày tổng kết doanh thu, gợi ý mặt hàng.
- **Daily-use:** người bán hàng dùng cả ngày, mọi ngày.
- **Stack:** Gemini + Image gen + Sheets (sổ đơn = thứ tiểu thương đã quen) + Firestore.
- **Impact:** hàng triệu hộ kinh doanh cá thể & người bán online ở VN; theme #6 Marketing & Social Commerce; tăng thu nhập trực tiếp → impact *kinh tế* đo được.
- **"Chưa ai làm tốt":** tool hiện có phân mảnh, tiếng Anh, cho DN lớn — chưa có "một app tiếng Việt cho chị bán hàng".
- **Scalability:** micro-SaaS thu phí theo tháng (economic model rõ nhất trong 5 ý tưởng), thêm quản lý kho, lên đơn vận chuyển.
- **Rủi ro:** không đụng API Facebook/Zalo (ngoài ecosystem!) → thao tác dán tay/chụp màn hình, cần UX khéo để không thấy "thủ công".

## 🅴 "Nói Đi!" — Luyện nói & phỏng vấn bằng giọng nói real-time
**Pitch:** Luyện **nói** tiếng Anh giao tiếp / phỏng vấn xin việc / thuyết trình với AI qua **Live API (voice real-time)** — AI đóng vai nhà tuyển dụng/khách hàng/người bản xứ, chấm & feedback ngay.
- **Daily-use:** luyện 10 phút mỗi ngày như Duolingo.
- **Stack:** Live API (công nghệ mới, ít người dùng → creativity kỹ thuật cao) + Gemini + Firestore (tiến độ).
- **Impact:** theme #7 Education; kỹ năng nói là điểm yếu lớn của người Việt học tiếng Anh.
- **Rủi ro:** ELSA Speak (VN) đã rất mạnh mảng phát âm → phải né sang **tình huống** (phỏng vấn, thuyết trình, deal lương) thay vì phát âm; Live API voice tiếng Việt/Anh cần test thực tế.

---

## 📊 Bảng chấm nhanh (thang 5)
| Tiêu chí | 🅰️ Lá Chắn | 🅱️ Ví Nhẹ | 🅲 Y Bạ | 🅳 Chốt Đơn | 🅴 Nói Đi |
|---|---|---|---|---|---|
| Impact VN | **5** | 4 | **5** | 4 | 4 |
| Daily-use | **5** | 4 | 4 | **5** | 4 |
| Feasibility (tháng 8) | **5** | 4 | 4 | 4 | 3 |
| Google tech depth | 4 | **5** | **5** | 4 | 4 |
| "Chưa ai làm tốt" | 4 | 4 | **5** | 4 | 2 |
| Scalability (user+economic) | 4 | 4 | 4 | **5** | 3 |
| Judge fit | **5** 🔥 | 4 | 4 | 3 | 3 |
| Demo 2 phút "wow" | **5** | 4 | 4 | 4 | 4 |
| **Tổng** | **37** | 33 | 35 | 33 | 27 |

## Kết quả vòng 1
- ❌ 🅰️ loại (vi phạm 3 luật thiết kế — xem bảng loại ở trên).
- ✅ **🅲 Sổ Y Bạ: SAVED** — pass cả 3 luật: input đồng nhất (ảnh tài liệu y tế), AI nặng chỉ chạy 1 lần lúc nhập, vận hành hằng ngày = đọc Firestore + nhắc lịch (~0 token).
- 🅱️ 🅳 🅴 giữ trong pool tham khảo.

---

# VÒNG 2 — Brainstorm theo 3 luật thiết kế

## 🅵 "Alo Con" — Nền tảng chăm sóc ba mẹ từ xa (evolution của 🅲)
**Pitch:** Kiến trúc **2 mặt**: **Web dashboard cho con cái** (nhập/quản lý mọi thứ: hồ sơ y tế, lịch uống thuốc, dặn dò) + **App siêu đơn giản cho ba mẹ** (nút to, voice-first tiếng Việt — chỉ NGHE nhắc thuốc, BẤM 1 nút hỏi AI bằng giọng nói, báo "con ơi ba ổn"). Người già gần như **zero thao tác** — mọi input phức tạp dồn về phía con cái trên web.
- **Vì sao pass 3 luật:** người già không nhập gì (luật 1); input do con cái nhập có form chuẩn (luật 2); AI voice chỉ chạy khi ba mẹ chủ động hỏi, còn nhắc lịch là logic thường (luật 3).
- **Ăn khớp tham vọng web+app của bạn nhất:** đây là ý tưởng mà **web và app không phải 2 phiên bản của nhau, mà là 2 vai trò khác nhau** — con dùng web ở văn phòng, ba mẹ dùng app trên điện thoại. Lý do tồn tại của cả 2 nền tảng là *thiết yếu*, không phải "cho có".
- **Stack:** Gemini (vision đọc đơn thuốc + voice hỏi đáp) + Firestore sync 2 đầu + Calendar/Tasks (lịch thuốc, tái khám) + Maps (nhà thuốc gần nhà ba mẹ).
- **Impact:** VN già hóa dân số nhanh top thế giới; hàng triệu con cái xa quê lo cho ba mẹ qua... cuộc gọi Zalo. Theme Healthcare + Inclusive Access (2 theme cùng lúc).
- **Scalability:** thêm module (huyết áp/đường huyết nhập tay hoặc ảnh, SOS, tin gia đình, nhật ký sức khỏe); gói gia đình trả phí; mở rộng sang người bệnh mãn tính, sau này là viện dưỡng lão/bác sĩ gia đình.
- **Demo 2 phút:** màn hình đôi — con thêm đơn thuốc trên web (chụp ảnh → AI đọc) → điện thoại ba mẹ reo nhắc uống thuốc bằng giọng nói dịu → ba bấm 1 nút hỏi "thuốc này uống trước hay sau ăn?" → AI trả lời từ đúng hồ sơ của ba. Cảm xúc + kỹ thuật trong 1 flow.

## 🅶 "Lịch Nhà Mình" — Lịch gia đình Việt (âm lịch + AI)
**Pitch:** Lịch chung cho cả nhà mà Google Calendar chưa bao giờ làm tốt cho người Việt: **giỗ chạp, rằm/mùng 1, lễ tết theo ÂM LỊCH** tự lặp đúng; gõ/nói tự nhiên "giỗ nội chủ nhật tuần sau, cả nhà về" → AI tạo event cho mọi thành viên + checklist đồ cúng vào Tasks.
- **Vì sao pass 3 luật:** input = 1 câu nói/gõ (đồng nhất, nhẹ); AI chỉ parse câu → structured event (task bounded, rẻ); ngày thường app chỉ hiển thị lịch (~0 token).
- **Stack:** Calendar API (sâu) + Gemini (NL → event, gợi ý lễ nghi) + Firestore (nhóm gia đình) + Tasks.
- **Impact & creativity:** cực kỳ "Việt" — chưa app nào làm tử tế mảng âm lịch gia đình; người già *quan tâm âm lịch nhất nhà* → app tự nhiên đa thế hệ.
- **Điểm yếu:** impact "mềm" hơn y tế; tần suất dùng theo tuần/tháng nhiều hơn theo ngày.

## 🅷 "Nhật Ký 1 Phút" — Sức khỏe tinh thần daily
**Pitch:** Mỗi tối nói (hoặc gõ) 1 phút về ngày hôm nay → AI ghi lại, nhận diện tâm trạng, cuối tuần tổng hợp insight ("tuần này bạn stress vào các ngày họp"); kết nối Calendar để tự gợi context ("hôm nay bạn có 5 cuộc họp, ngày dài ha?").
- **Vì sao pass 3 luật:** input sinh ra **trong app**, đúng 1 dạng (1 entry/ngày); 1 lần AI/ngày → token đoán trước được tuyệt đối; zero dữ liệu ngoài.
- **Stack:** Gemini + Live API (nói thay vì gõ) + Firestore + Calendar (đọc context ngày).
- **Impact:** sức khỏe tinh thần ở VN gần như trống, người trẻ đô thị rất cần; daily habit **by design** (như Duolingo của journaling).
- **Điểm yếu:** khó demo "wow" bằng y tế; retention là bài toán thật (nhưng cũng chính là chỗ chứng minh engagement nếu làm được).

---

## 📊 Bảng chấm vòng 2 (thang 5, đã tính 3 luật thiết kế)
| Tiêu chí | 🅲 Y Bạ (gốc) | 🅵 Alo Con | 🅶 Lịch Nhà | 🅷 Nhật Ký |
|---|---|---|---|---|
| Impact VN | 5 | **5** | 3 | 4 |
| Daily-use | 4 | **5** | 3 | **5** |
| Pass 3 luật thiết kế | 4 | **5** | **5** | **5** |
| Feasibility (tháng 8) | 4 | 4 | **5** | **5** |
| Google tech depth | 5 | **5** | 4 | 4 |
| "Chưa ai làm tốt" | 5 | **5** | **5** | 3 |
| Scalability (user+econ+app) | 4 | **5** | 3 | 3 |
| Lý do tồn tại của web+app | 3 | **5** 🔥 | 4 | 3 |
| Demo 2 phút "wow" | 4 | **5** | 3 | 3 |
| **Tổng /45** | 38 | **44** | 35 | 35 |

## 🏆 Đề xuất vòng 2
**🅵 "Alo Con"** = 🅲 Y Bạ được tái kiến trúc theo đúng 3 luật của bạn + tận dụng tham vọng web+app thành **lợi thế cấu trúc** (2 nền tảng = 2 vai trò, không phải bản sao nhau). Giữ toàn bộ cái hay của Y Bạ (hồ sơ y tế AI, nhắc thuốc, Maps) nhưng chuyển gánh nặng thao tác từ người già sang con cái — đúng tinh thần "user không phải thao tác nhiều".

---

---

# VÒNG 3 — Quyết định & notes

## ✅ HƯỚNG ĐÃ CHỐT: 🅵+🅲 merge — "Nền tảng sức khỏe gia đình"
- Không chỉ người già — **giới trẻ cũng có vấn đề sức khỏe** → mở rộng cho mọi lứa tuổi, "Alo Con" (chăm ba mẹ từ xa) là 1 use-case/module trong đó.
- **Tủ Thuốc Nhà** = tính năng bắt buộc có (đã lưu hồ sơ thuốc thì hạn dùng/tương tác là đương nhiên).
- **Database thuốc tự dày lên:** mỗi lần user chụp → lưu structured vào DB chung; developer cũng chủ động seed sẵn các thuốc phổ biến VN → càng dùng càng chính xác, token càng rẻ (cache hit).

## 📌 Thực tế về auth (đã verify — chi tiết ở [15-Google-Ecosystem.md](15-Google-Ecosystem.md))
- Không có zero-consent tuyệt đối: lần đầu sign in user bấm "Cho phép" **1 lần duy nhất** cho các scope app cần → sau đó tự động mãi.
- Web ↔ app cùng sản phẩm: sync qua **Firestore của mình** → tự động hoàn toàn, không consent gì.
- Scope Gmail = "restricted" (verify nặng khi publish công khai); **Calendar/Tasks = nhẹ** → app sức khỏe chỉ cần scope nhẹ, thêm 1 lợi thế so với các ý tưởng đọc Gmail.

## 💾 Save for future (ý tưởng cá nhân của Thanh)
- **App chăm cây cảnh:** chụp ảnh → nhận diện cây, cách chăm tốt nhất, lịch tưới/bón, lưu ý theo mùa. Cùng DNA kiến trúc với app sức khỏe (chụp → phân tích 1 lần → lịch + nhắc) → tái dùng ~70% codebase sau này. Impact/audience nhỏ hơn health nên không chọn cho cuộc thi.

## Pool ý tưởng vòng 3 (đã list, chưa ai được chọn)
Bữa Cơm Nhà · Ký Ức Nhà · Đơn Giản Hóa · Hồ Sơ Xe · Sổ Thu Chi Tiệm · Nhà Trọ Manager · Ôn Cùng Con · 5 Phút Tiếng Anh · Sổ Tay Ruộng Vườn · Lương Của Tôi
*(Loại thêm: "Sáng Nay Có Gì" — các AI assistant chính chủ đã làm được khi connect Gmail/Calendar.)*

---

## 📝 Khung chốt ý tưởng (điền khi quyết)
- **Tên dự án:**
- **Theme chính thức:** — **Đề đối tác liên quan:**
- **Vấn đề & người dùng:**
- **Tính năng MVP (3–5):**
- **Google tech:** — **Deploy:** Cloud Run + Google Play
- **Kế hoạch user thật + đo impact:**
- **Kịch bản demo 2 phút:**
