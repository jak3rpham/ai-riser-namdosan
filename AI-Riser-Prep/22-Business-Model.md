# 22 — Mô hình kinh tế & Scalability (v1 — CỔNG BẮT BUỘC trước handoff)

> Thanh: *"trước khi qua Antigravity phải giải quyết mô hình kinh tế đã, từ đó có direction cho demo đầu tiên."* File này trả lời: **ai trả tiền, trả bao nhiêu, vì sao trả, chi phí bao nhiêu, lớn lên bằng cách nào** → và **demo đầu tiên phải khoe gì**.

---

## 1. 💡 Insight lõi: người TRẢ TIỀN ≠ người DÙNG CHÍNH

| | Người dùng chính | Người trả tiền |
|---|---|---|
| Ai | **Ba mẹ (P2)** — 60+, không có thu nhập chủ động, không quen trả phí app | **Con cái (P1)** — 25–45, đi làm, có thu nhập, quen trả phí số |
| Động cơ | Được nhắc, được hiểu thuốc | **"Con ở xa mà vẫn lo được cho ba mẹ"** — mua sự AN TÂM và cách làm tròn chữ hiếu |

**Vì sao đây là mô hình mạnh ở VN:**
- Người Việt **chi cho cha mẹ dễ hơn chi cho bản thân**. Cùng số tiền: mua cho mình = "phí", mua cho ba mẹ = "hiếu".
- Cùng nhóm tâm lý đã chi tiền thật: thuốc bổ, thực phẩm chức năng, gói khám sức khỏe cho ba mẹ, bảo hiểm cho ba mẹ — **thị trường đã được educate**, giá tham chiếu cao hơn app giải trí nhiều.
- Rào cản "người già không biết trả tiền online" **biến mất** vì con cái thanh toán.

> Đây là câu trả lời cho câu hỏi kinh điển của giám khảo: *"App cho người già thì ai trả tiền?"*

---

## ⚠️ 1b. GIAI ĐOẠN CUỘC THI: HOÀN TOÀN MIỄN PHÍ — KHÔNG HIỂN THỊ GIÁ (Thanh chốt 10/08)

**Trong app & bản publish dự thi:**
- ❌ **Không** có bảng giá, không nút nâng cấp, không paywall, không đếm ngược dùng thử.
- ✅ **Tất cả tính năng mở hết**, miễn phí, để giám khảo và người dùng trải nghiệm trọn vẹn.
- Mô hình giá ở mục 2 **chỉ là luận điểm khi PITCH** (form nộp bài, video, phần roadmap) — trả lời câu hỏi *"sau này sống bằng gì?"*, không phải thứ nhét vào sản phẩm lúc này.

*Reasoning:*
1. Giám khảo gặp paywall = trải nghiệm cụt → mất điểm oan.
2. Người dùng thử sẽ ngại nếu thấy "sẽ thu phí" → **giảm lượng user thật**, mà user thật mới là điều kiện lên Gold ([26](26-User-Testing-Metrics.md)).
3. Vẫn giữ nguyên giá trị pitch: *"đã có mô hình doanh thu rõ ràng, nhưng giai đoạn này ưu tiên học từ người dùng"* — đây là câu trả lời chín chắn, không phải né tránh.

> **Hệ quả kỹ thuật:** vì không thu phí nhưng vẫn phải chặn lạm dụng, việc kiểm soát chi phí chuyển hoàn toàn sang **quota kỹ thuật** thay vì gói trả phí → xem [24](24-Scale-Cost-Control.md).

## 2. Cấu trúc gói (đề xuất — CHỈ dùng cho phần pitch, chưa áp dụng)

| Gói | Giá đề xuất | Gồm gì | Mục đích |
|---|---|---|---|
| **Free** | 0đ | 1 người được chăm sóc · nhắc thuốc không giới hạn · 3 lần đọc đơn thuốc bằng AI/tháng · tủ thuốc cơ bản | Ai cũng dùng được — **không bao giờ tính phí việc nhắc uống thuốc** (đạo đức + là hook giữ chân) |
| **Gói Nhà** ⭐ | **~49.000đ/tháng** hoặc **~449.000đ/năm** | Không giới hạn thành viên · đọc đơn không giới hạn · cảnh báo tương tác thuốc & **kiêng ăn (M12)** · theo dõi chỉ số · trợ lý giọng nói · lịch sử đầy đủ · nhiều người quản lý | Doanh thu chính |
| **Gói Nhà+** (V2) | ~99.000đ/tháng | Thêm: bản tóm tắt cho bác sĩ (Google Docs) · tư vấn ưu tiên · lưu trữ ảnh không giới hạn | Nâng ARPU nhóm nhiệt tình |

**Neo giá:** 49k/tháng ≈ 2 ly cà phê — rẻ hơn 1 hộp thực phẩm chức năng cho ba mẹ (300–800k), rẻ hơn 1 lần khám dịch vụ (300–500k). Ngang tầm Spotify/Netflix VN → **người trả đã quen mức giá này**.

**Nguyên tắc đạo đức (cũng là chiến lược):** tính năng **cứu mạng không bao giờ khóa sau paywall** — nhắc uống thuốc, cảnh báo tương tác nguy hiểm luôn miễn phí. Tính phí ở **tiện lợi & chiều sâu** (đọc đơn không giới hạn, nhiều thành viên, phân tích). Điều này vừa đúng đạo lý vừa tránh rủi ro truyền thông.

---

## 3. Unit economics (khung tính — số cần verify khi có pricing thực tế)

**Chi phí biến đổi / gia đình / tháng** (nhờ 3 luật thiết kế, chi phí gần như tỉ lệ với *lượng dữ liệu mới nhập*, không tỉ lệ với thời gian dùng):

| Hạng mục | Tần suất điển hình | Ghi chú chi phí |
|---|---|---|
| Đọc đơn/tài liệu (vision) | 2–4 lần/tháng/nhà | 1 call/tài liệu |
| Giải thích thuốc | Chỉ lần đầu mỗi thuốc | **Cache vĩnh viễn** trong `med_catalog` |
| Cảnh báo tương tác thuốc & kiêng ăn | Chỉ khi gặp cặp mới | **Cache toàn hệ thống** — gia đình thứ N gần như 0 |
| Nhắc thuốc, dashboard, xác nhận | Hằng ngày | **0 token** (TTS template + đọc Firestore) |
| Trợ lý giọng nói | Tùy người dùng | Chi phí cao nhất → giới hạn mềm ở gói Free |
| Firestore + Cloud Run | — | Scale-to-zero, chi phí nhỏ ở quy mô này |

→ **Đặc điểm kinh tế đẹp:** app **càng nhiều người dùng, chi phí biên/gia đình càng GIẢM** (catalog thuốc & tương tác dùng chung được cache). Ngược hoàn toàn với app AI thông thường (dùng nhiều = tốn nhiều).
→ Biên lợi nhuận gộp kỳ vọng **rất cao** ở mức giá 49k. *(Cần chốt lại bằng pricing Gemini thực tế khi build — ghi vào backlog.)*

---

## 4. Quy mô thị trường (số liệu thật, có nguồn)

| Chỉ số | Con số | Ý nghĩa |
|---|---|---|
| Dân số VN 2026 | **>101 triệu** | |
| Người **60+** hiện tại | **14,2 triệu** | Người được chăm sóc tiềm năng |
| Dự báo 2030 / 2034 | **~18 triệu** / **20,9 triệu** | Thị trường **tự lớn 40%+ trong 8 năm** — gió thuận |
| Bệnh mãn tính trung bình/người cao tuổi | **2,7 bệnh** | → nhiều loại thuốc → **đúng nỗi đau của app** |
| Tuân thủ dùng thuốc ở bệnh nhân cao tuổi | chỉ **30–50%** (nhiều nghiên cứu) | **Đây là con số vàng**: hơn nửa số người không uống thuốc đúng |
| Tuân thủ chế độ ăn kiêng | **68,4%** | → củng cố tính năng M12 "kiêng gì" |
| Viện dưỡng lão & trung tâm chăm sóc cả nước | **~40** cho ~17 triệu người cao tuổi | Hạ tầng chăm sóc gần như trống → **gánh nặng dồn lên gia đình** = khách hàng của mình |

**TAM/SAM/SOM (ước lượng):**
- **TAM:** hộ gia đình VN có người 60+ (~10 triệu hộ, ước tính).
- **SAM:** hộ có **con cái dùng smartphone + có khả năng chi trả** (thành thị & cận thành thị) — vài triệu hộ.
- **SOM (12–24 tháng đầu):** vài chục nghìn hộ qua kênh cộng đồng & lan truyền cảm xúc.
- Chỉ cần **10.000 gia đình trả 449k/năm ≈ 4,5 tỷ đồng/năm** — quy mô khả thi cho một sản phẩm khởi nghiệp, với biên lợi nhuận gộp cao.

> Luận điểm pitch: *"Việt Nam sẽ có 20,9 triệu người cao tuổi vào 2034 nhưng chỉ có ~40 viện dưỡng lão. Việc chăm sóc sẽ diễn ra TẠI NHÀ, do con cái — và họ đang làm việc đó bằng trí nhớ và những cuộc gọi Zalo."*

---

## 4b. Đối thủ & định vị (khảo sát 11/08)

| Nhóm | Ví dụ | Họ làm gì | Khoảng trống |
|---|---|---|---|
| **App nhắc thuốc quốc tế** | Medisafe, MyTherapy | Nhắc thuốc cho **cá nhân tự quản**, giao diện tiếng Anh, **nhập tay từng thuốc** | Không có vai trò "người chăm sóc", không đọc được đơn thuốc VN, người già không dùng nổi |
| **App y tế VN** | MediHome, app Nhà thuốc Long Châu | Nhắc thuốc gắn với phòng khám / nhà thuốc của họ | Gắn với hệ sinh thái riêng của đơn vị đó; vẫn là mô hình 1 người dùng |
| **Sổ sức khỏe điện tử (Bộ Y tế)** | — | Hồ sơ sức khỏe quốc gia | Hành chính, không phải công cụ chăm sóc hằng ngày trong nhà |
| **Công cụ AI đơn lẻ** | PillScan (đếm thuốc bằng AI), Drug Bank (tra cứu thuốc) | Giải đúng **một mảnh** nhỏ | Không nối thành vòng chăm sóc |

**Khoảng trống rõ ràng — không ai đang chiếm:**
1. **Mô hình 2 vai trò** (người chăm sóc ↔ người được chăm sóc) — tất cả app hiện có đều thiết kế cho **một người tự quản lý bản thân**, trong khi thực tế VN là *con cái quản, ba mẹ uống*.
2. **Đọc đơn thuốc Việt Nam bằng AI** (đơn viết tay, túi thuốc nhà thuốc) thay vì bắt nhập tay từng loại.
3. **Cảnh báo thuốc ↔ thức ăn Việt** (M12) — không app nào làm.
4. **Thiết kế cho người không đọc được chữ** (capability C4, voice-first, định danh thuốc bằng ảnh thật).

→ Định vị một câu: *"Các app khác nhắc BẠN uống thuốc. Chúng tôi giúp BẠN chăm ba mẹ uống thuốc."*

## 5. Vòng tăng trưởng (growth loop) — CAC gần 0

```
Con cái cài app cho ba mẹ
      │
      ├──▶ Mời anh/chị/em cùng vào quản lý  ──▶ mỗi gia đình = 2–4 người dùng
      │
      ├──▶ Ba mẹ khoe hàng xóm/bạn già ("con tao cài cho cái này")
      │
      └──▶ Con cái kể chuyện cảm xúc trên MXH ──▶ người cùng cảnh ngộ cài theo
```
- **Đơn vị lan truyền là GIA ĐÌNH, không phải cá nhân** → hệ số lan truyền tự nhiên cao.
- Kênh 0đ: hội nhóm "chăm sóc cha mẹ", cộng đồng bệnh mãn tính, hội đồng hương xa quê.
- Nội dung tự sinh: chính bài LinkedIn/Facebook của cuộc thi là mồi tăng trưởng đầu tiên.

## 6. Giữ chân & hào bảo vệ (moat)

| Lớp | Nội dung |
|---|---|
| **Dữ liệu tích lũy** | Hồ sơ y tế nhiều năm của cả nhà — chuyển app = mất lịch sử. Chi phí chuyển đổi rất cao |
| **Thói quen hằng ngày** | Nhắc thuốc mỗi ngày = app được mở mỗi ngày |
| **Ràng buộc cảm xúc** | Bỏ app = cảm giác bỏ bê ba mẹ |
| **Mạng lưới gia đình** | Nhiều người trong nhà cùng dùng → không ai bỏ một mình được |
| **Catalog thuốc VN tự dày** | Càng nhiều đơn được chụp, DB thuốc & tương tác càng đầy → **đối thủ mới phải bắt đầu từ 0** (tài sản dữ liệu thật) |

## 7. Scalability — đủ 3 chiều Thanh yêu cầu

**a) Người dùng:** 1 gia đình → nhiều gia đình → thị trường ĐNÁ có cùng cấu trúc văn hóa (Indonesia, Philippines, Thái — con cái chăm cha mẹ, già hóa nhanh). Kiến trúc đa ngôn ngữ (VI/EN) đã tính từ đầu.

**b) Kinh tế:** chi phí biên **giảm dần** theo quy mô (cache dùng chung); hạ tầng Google tự co giãn (Cloud Run scale-to-zero, Firestore); không có chi phí vận hành con người theo từng khách.

**c) Sản phẩm — đây là chỗ mạnh nhất:** cùng một **pipeline lõi** `chụp → AI hiểu → tạo lịch → nhắc → xác nhận → báo cáo`, thay "thuốc" bằng thứ khác là ra sản phẩm mới:

| Mở rộng | Đối tượng | Tái dùng |
|---|---|---|
| Tiêm chủng & phát triển trẻ nhỏ | Bố mẹ trẻ | ~85% |
| Bệnh mãn tính người trẻ | P3 (đã có sẵn) | ~95% |
| Thú cưng (lịch tiêm, thuốc) | Chủ nuôi | ~80% |
| **Chăm cây cảnh** (ý tưởng cũ của Thanh) | Người trồng cây | ~70% |
| Bảo dưỡng xe, thiết bị nhà | Hộ gia đình | ~65% |

→ Không phải "một app nhắc thuốc" mà là **nền tảng chăm sóc theo lịch có AI hiểu tài liệu** — luận điểm scalability rất mạnh khi pitch.

## 8. Doanh thu tương lai (V2+, không làm cho cuộc thi)

| Hướng | Mô tả | Lưu ý |
|---|---|---|
| **B2B2C nhà thuốc** | App biết khi nào nhà sắp hết thuốc → giới thiệu nhà thuốc đối tác giao tận nơi | Chỉ là **hợp tác thương mại**, kỹ thuật vẫn 100% Google — không phá nguyên tắc "no external API" |
| **B2B phòng khám** | Phòng khám tặng bệnh nhân bản Nhà+ để tăng tuân thủ điều trị & tái khám | Bán theo gói cho phòng khám |
| **Bảo hiểm sức khỏe** | Tuân thủ thuốc tốt → giảm nhập viện → giảm bồi thường; hãng bảo hiểm tài trợ gói | Cần dữ liệu chứng minh (đã có nghiên cứu về liên hệ tuân thủ ↔ giảm nhập viện) |
| Hợp tác chương trình y tế cộng đồng | Bản miễn phí cho vùng nông thôn, tài trợ bởi tổ chức | Impact + PR |

> ⚠️ **Nguyên tắc giữ vững:** mọi tích hợp **kỹ thuật** vẫn nằm trong Google ecosystem. Các hướng trên là **quan hệ thương mại**, không phải phụ thuộc API bên thứ ba.

---

## 9. 🎯 ĐIỀU NÀY ĐỊNH HƯỚNG DEMO ĐẦU TIÊN NHƯ THẾ NÀO

Vì **người trả tiền là con cái** và thứ họ mua là **sự AN TÂM**, nên demo **không được** là tour tính năng. Demo phải tái hiện **khoảnh khắc an tâm**:

**Nguyên tắc demo:**
1. **Nhân vật chính là người con**, không phải app. Mở bằng nỗi lo của họ.
2. **Màn hình đôi** (web của con ↔ điện thoại ba mẹ) — cho thấy khoảng cách địa lý được nối lại. Đây là hình ảnh bán hàng mạnh nhất, cũng là thứ chứng minh kiến trúc web+app có lý do tồn tại.
3. **Khoảnh khắc chốt hạ:** ba bấm "Đã uống" → màn hình con **sáng lên** ở đầu bên kia. Đó là sản phẩm. Mọi thứ khác là phụ trợ.
4. Trí tuệ của AI thể hiện qua **1 chi tiết bất ngờ** thay vì liệt kê: cảnh báo *"Ba đang uống thuốc mỡ máu — tuần này tránh ăn bưởi nha"* (M12). Người xem sẽ nhớ đúng chi tiết này.
5. Kết bằng **con số thật** (gia đình dùng thử) + **1 câu về mô hình kinh tế** (ai trả, vì sao) + tầm nhìn nền tảng.

**Thứ tự ưu tiên xây cho demo (direction cho Antigravity):**
> ① Web: nhập đơn → AI đọc → xác nhận → lịch tự sinh ▸ ② App: nhận nhắc → "Đã uống" → đồng bộ ngược về web ▸ ③ Cảnh báo kiêng ăn (M12) ▸ ④ Trợ lý giọng nói ▸ ⑤ Phần còn lại.
>
> Nếu thiếu thời gian, **cắt từ dưới lên** — ①②③ là bộ khung không được phép thiếu, vì đó chính là thứ khách hàng trả tiền.

## 🔲 Cần Thanh duyệt
1. Mức giá 49k/tháng — 449k/năm hợp lý chưa?
2. Nguyên tắc "không tính phí tính năng cứu mạng" — đồng ý?
3. Thứ tự ưu tiên xây cho demo (①→⑤) — chốt để làm direction cho Antigravity?

## Nguồn
- [Dân số VN 2026 & cơ cấu tuổi](https://fptshop.com.vn/tin-tuc/for-gamers/doi-net-ve-dan-so-viet-nam-2026-198799) · [Dân số VN tiếp tục già hóa — VnExpress](https://vnexpress.net/dan-so-viet-nam-tiep-tuc-gia-hoa-4837035.html) · [Xu hướng già hóa — Tổng cục Thống kê](https://www.nso.gov.vn/du-lieu-va-so-lieu-thong-ke/2025/01/xu-huong-gia-hoa-dan-so-nhanh-o-viet-nam-thuc-trang-va-giai-phap/)
- [Aging population strains healthcare — SGGP](https://en.sggp.org.vn/aging-population-strains-healthcare-and-social-security-systems-post125400.html)
- [Medication adherence & hospitalizations in older Vietnamese patients — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12122135/) · [Medication use in elderly hypertension patients VN 2024–2025 — BMC Geriatrics](https://link.springer.com/article/10.1186/s12877-025-06869-7)
