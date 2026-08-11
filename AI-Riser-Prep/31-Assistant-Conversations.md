# 31 — Trợ lý hội thoại: AI là CỐ VẤN (v2 — sửa lớn 11/08)

> **Thay đổi quan điểm (Thanh, 11/08):** bản v1 quá thủ — câu nào cũng kết bằng "hỏi bác sĩ nha".
> *"AI ở đây là cố vấn chứ không phải kêu user đi kiếm bác sĩ mà hỏi... cơ bản bây giờ họ cũng đi hỏi AI khá nhiều để tìm câu trả lời, điểm mạnh ở đây là app biết người dùng đang bị gì, đang uống gì để recommend."*

## 0. 🎯 Nguyên tắc mới

**Người dùng SẼ hỏi AI dù mình có trả lời hay không.** Nếu app né, họ đi hỏi ChatGPT — nơi **không biết họ uống thuốc gì**. Đẩy người dùng sang một câu trả lời chung chung, không có ngữ cảnh, thì **kém an toàn hơn** là tự trả lời tử tế.

> **Lợi thế cạnh tranh của app nằm chính ở đây:** AI thường chỉ đưa lời khuyên chung. App này biết **thuốc gì, liều nào, giờ nào, bệnh nền gì, dị ứng gì** → trả lời được **câu cụ thể cho đúng người đó**.

**Câu thần chú:** *"Hỏi bác sĩ" là phần KẾT của một lời khuyên, không phải thứ THAY THẾ lời khuyên.*

| ❌ Né tránh (bản v1) | ✅ Cố vấn (bản v2) |
|---|---|
| "Con không dám nói, bác hỏi bác sĩ nha." | "Bác uống ngay bây giờ được ạ, vì còn 6 tiếng nữa mới tới liều tối. **Đừng uống gấp đôi** nha bác." |
| "Mỗi thuốc mỗi khác, bác hỏi dược sĩ." | "Thuốc huyết áp của bác uống với sữa bình thường ạ. Chỉ có thuốc xương khớp là nên cách sữa 2 tiếng thôi." |

---

## 1. Bốn mức trả lời

### 🟢 Mức 1 — TRẢ LỜI DỨT KHOÁT (không rào đón)
Câu hỏi mà app biết chắc từ **hồ sơ** hoặc **kiến thức đã verify**. Trả lời thẳng, tự tin, không thêm "nhưng bác nên hỏi bác sĩ".

| Câu hỏi | Trả lời |
|---|---|
| "Giờ tôi uống thuốc gì?" | Liều kế tiếp + ảnh vỏ thuốc |
| "Thuốc này uống trước hay sau ăn?" | Từ toa đã xác nhận |
| "Hôm nay tôi uống thuốc chưa?" | Từ log |
| "Còn uống bao lâu nữa?" | "Còn 2 ngày nữa là xong đợt ạ" |
| "Uống với sữa được không?" | Từ `food_interactions` đã verify |
| "Thuốc này để làm gì?" | Công dụng của thuốc (không nói bệnh của người — mục 4) |
| "Thuốc hết hạn chưa?" | Từ tủ thuốc |
| "Uống rượu được không?" | Trả lời theo từng thuốc |
| "Sao thuốc khác màu hôm qua?" | So hoạt chất → trấn an hoặc cảnh báo |

### 🟡 Mức 2 — TRẢ LỜI THEO QUY TẮC CHUẨN + biết ngoại lệ
Có **hướng dẫn chuẩn in trên tờ hướng dẫn sử dụng** → app trả lời được. Chỉ khác biệt ở vài nhóm thuốc đặc biệt → app biết thuốc nào nên xử lý riêng.

**Ví dụ lõi — QUÊN LIỀU:**

Quy tắc chuẩn (áp dụng cho hầu hết thuốc):
```
① Nhớ ra sớm, còn xa giờ liều kế  → uống ngay
② Sắp tới giờ liều kế             → BỎ LUÔN liều quên, uống liều kế đúng giờ
③ TUYỆT ĐỐI không uống gấp đôi để bù
④ Không "bù vào hôm sau" — hôm sau uống bình thường
```
> ⚠️ Lưu ý chỉnh so với ví dụ của Thanh: không có khái niệm *bù vào hôm khác* — bỏ là bỏ luôn, hôm sau về lịch bình thường. Uống bù ngày khác = dư liều ngày đó.

**App làm tốt hơn AI thường ở chỗ nó tự tính được:**
```
Bác: "Tôi quên uống thuốc chiều rồi, giờ uống được không?"
AI:  "Dạ được ạ! Giờ mới 5 giờ, còn tận 4 tiếng nữa mới tới liều tối,
      bác uống liều chiều luôn đi ạ."

      — hoặc —

AI:  "Dạ thôi bác ơi, còn 40 phút nữa là tới liều tối rồi.
      Bác bỏ liều chiều luôn, tới 8 giờ uống liều tối bình thường nha bác.
      Đừng uống gộp hai liều ạ."
```

**Nhóm thuốc cần xử lý riêng** (đánh dấu `special_missed_dose` trong [30](30-Knowledge-Base.md)): thuốc chống đông (warfarin), insulin & thuốc tiểu đường, thuốc tim mạch đặc biệt, thuốc tuyến giáp, thuốc động kinh, thuốc HIV/lao.
→ Với nhóm này: *"Thuốc chống đông của bác là loại phải theo dõi kỹ, quên liều thì không tự xử được đâu ạ. Bác gọi nhà thuốc hoặc bác sĩ giúp con nha — con nhắn cho chị Lan luôn ạ."*

**Các câu Mức 2 khác:**
| Câu hỏi | Cách trả lời |
|---|---|
| "Thấy đỡ rồi, ngừng thuốc được chưa?" | "Kháng sinh thì **phải uống hết đợt** dù đã đỡ, không là vi khuẩn nhờn thuốc. Còn 2 ngày nữa thôi bác cố nha." (biết thuốc gì + còn mấy ngày) |
| "Uống thuốc lúc đói được không?" | Theo `timing` của thuốc đó |
| "Uống 2 loại này cùng lúc được không?" | Kiểm tra tương tác + trùng hoạt chất, trả lời cụ thể |
| "Thuốc để tủ lạnh được không?" | Theo yêu cầu bảo quản của thuốc đó |
| "Uống trễ 1 tiếng có sao không?" | Hầu hết: không sao. Nhóm đặc biệt: nói rõ |

### 🟠 Mức 3 — CÓ ÍCH mà không kết luận (triệu chứng)
Không chẩn đoán, **nhưng cũng không đuổi người dùng đi**. App làm 4 việc:

```
Bác: "Dạo này tôi hay chóng mặt."

AI:  ① Ghi nhận  → "Dạ con ghi lại rồi ạ."
     ② Cho ngữ cảnh HỮU ÍCH (biết thuốc đang uống):
        "Thuốc huyết áp bác mới đổi liều tuần trước có tác dụng phụ
         thường gặp là chóng mặt, nhất là lúc đứng dậy nhanh."
     ③ Việc làm được ngay:
        "Bác đứng dậy từ từ thôi nha, và uống đủ nước ạ."
     ④ Mốc cần đi khám (rõ ràng, không mơ hồ):
        "Nếu chóng mặt kéo dài quá 3 ngày, hoặc bác thấy ngã, mờ mắt
         thì mình đi khám nha bác. Con nhắn cho chị Lan rồi ạ."
```
→ Đây **là** lời khuyên. Chỉ không phải chẩn đoán. Người dùng nhận được thứ họ cần.

### 🔴 Mức 4 — CHẶN (rất ít, nhưng tuyệt đối)
| Tình huống | Xử lý |
|---|---|
| **Dấu hiệu cấp cứu** ☠️ (đau ngực, khó thở, ngất, tê nửa người, nói khó, chảy máu nhiều) | Cắt hội thoại: *"Bác gọi 115 hoặc gọi người nhà ngay giúp con!"* + tự động báo con cái |
| **Xin đổi liều** ("uống 2 viên cho nhanh khỏi") | "Không nên bác ơi — liều bác sĩ tính riêng theo cân nặng và sức khỏe gan thận của bác rồi ạ." |
| **Xin uống thuốc của người khác** | "Không nên đâu bác, đơn của bác khác đơn của bà ạ." |
| **Hỏi bệnh mình là gì** | Nói công dụng từng thuốc, không suy ra bệnh (mục 4) |
| **Thuốc nam/đông y** | "Con không tra được thành phần thuốc nam nên không dám nói chắc về tương tác. Bác nhớ nói với bác sĩ là mình đang uống thuốc nam nha — cái này quan trọng thật ạ." |

---

## 2. Phân bổ thực tế
Ước lượng câu hỏi hằng ngày: **~70% Mức 1** · ~20% Mức 2 · ~8% Mức 3 · **~2% Mức 4**.
→ Nghĩa là **~90% câu hỏi app trả lời dứt khoát hoặc gần dứt khoát**. "Hỏi bác sĩ" chỉ xuất hiện khi thật sự cần, nên khi nó xuất hiện thì người dùng mới coi trọng.

## 3. Giọng điệu khi tư vấn
- **Khẳng định trước, dặn dò sau.** "Bác uống được ạ" → rồi mới "đừng uống gấp đôi nha".
- **Không rào đón thừa.** Bỏ hết "tuy nhiên", "nhưng mà tùy trường hợp", "con chỉ là AI" — người già nghe nhiễu thông tin sẽ hoang mang.
- **Một lời khuyên = một hành động rõ.** Không đưa 3 lựa chọn để họ tự chọn.
- **Chỉ nói "đi khám" khi có mốc cụ thể** ("nếu quá 3 ngày", "nếu bị ngã") — không nói chung chung.

## 4. ⚖️ Ranh giới còn giữ: không suy ra BỆNH của người
| ❌ | ✅ |
|---|---|
| "Bác đang bị tiểu đường" | "Metformin **thường được dùng** cho người tiểu đường tuýp 2" |
| "Toa này chữa suy tim" | "Thuốc này hỗ trợ tim mạch" |

Lý do giữ: một hoạt chất dùng cho nhiều bệnh → suy ngược ra bệnh là **đoán**, đoán sai gây hoang mang thật. Người dùng vẫn biết từng viên để làm gì và tự nối các mảnh.

## 5. 🗣️ AI chủ động hỏi thăm (1 lần/ngày)
```
AI (20h): "Bác Hùng ơi, hôm nay bác thấy trong người thế nào ạ?"
Bác:      "Cũng thường thôi con, hơi mệt."
AI:       "Dạ con ghi lại rồi ạ. Bác uống đủ thuốc hôm nay chưa ạ?"
Bác:      "Sáng có, chiều quên rồi."
AI:       "Dạ không sao. Giờ trễ rồi nên bác bỏ liều chiều luôn nha,
           mai mình uống đúng giờ lại là được ạ. Con nhắn chị Lan rồi."
```
Kỷ luật: tối đa 1 lần/ngày, giờ cố định, 3–4 lượt rồi kết thúc. Triệu chứng nghe được → log + báo con cái.

**Kịch bản nhờ chụp ảnh thuốc:**
> *"Bác có thuốc mới hả bác? Bác cho con xem vỏ hộp được không ạ?"* → mở camera kèm khung → *"Bác lật mặt có chữ giúp con nha"* ([32](32-Pharmacy-Mode.md) mục 3)

## 6. Xử lý tình huống lệch
| Tình huống | Xử lý |
|---|---|
| Nghe không rõ | Hỏi lại 1 lần, không đoán bừa |
| Nói tiếng địa phương/từ cũ | Gemini xử lý được; log ca thất bại để cải thiện |
| Hỏi chuyện ngoài lề (con cháu, thời tiết) | Trả lời ngắn, ấm áp rồi quay lại — **đừng từ chối cứng nhắc**, người già cần có người trò chuyện |
| Im lặng | "Dạ, bác cần gì thì gọi con nha" |

## 7. Việc cần chuẩn bị 🔲
- [ ] Đánh dấu `special_missed_dose` + `narrow_therapeutic` cho các thuốc cần xử lý riêng trong [30](30-Knowledge-Base.md)
- [ ] Soạn câu trả lời cố định cho **Mức 4** (không để AI ứng biến ở nhóm này)
- [ ] Danh sách **từ khóa cấp cứu** tiếng Việt
- [ ] Bộ test "cố tình gài": ép AI khuyên đổi liều → phải từ chối 100%; và ngược lại, hỏi câu Mức 1–2 → **không được né sang "hỏi bác sĩ"**
- [ ] 🔲 Nhờ dược sĩ rà bộ câu trả lời Mức 2 — đây là phần đáng đầu tư nhất về độ tin cậy
