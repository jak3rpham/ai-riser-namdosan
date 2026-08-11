# 20 — Notification Design (v1 — CHỜ THANH DUYỆT)

> Notification là **sản phẩm chính** của app phía ba mẹ (P2 gần như chỉ "nhận") — thiết kế sai là app thành cái loa phiền. File này thiết kế toàn bộ hệ thống nhắc.

## 1. Triết lý (5 nguyên tắc)
1. **Mỗi notification là một hành động chăm sóc, không phải một nhiệm vụ.** Copy không ra lệnh, không đổ lỗi: ❌ "Bạn đã QUÊN uống thuốc!" → ✔ "Uống muộn chút cũng không sao, mình uống bây giờ nha bác."
2. **Giọng nói song song chữ viết** — mọi nhắc phía P2 đều **đọc to được** (C4 không đọc được chữ; C1–C3 cũng tiện). Giọng ấm, xưng hô đúng vai ("Bác Hùng ơi...").
3. **Ngân sách phiền nhiễu:** mỗi member có trần notification/ngày; vượt trần → gộp. Con cái (P1) mặc định nhận **digest gộp**, chỉ việc khẩn mới đẩy riêng.
4. **Escalation có bậc thang, không dội bom** (chi tiết mục 3).
5. **Quiet hours:** 22h–6h im lặng tuyệt đối (trừ thuốc được kê đúng giờ đó).

## 2. Danh mục notification

### Phía ba mẹ (P2 — app)
| # | Loại | Khi nào | Hình thức |
|---|---|---|---|
| N1 | **Nhắc liều** | đúng giờ theo toa | Full-screen kiểu báo thức + TTS đọc to: tên gọi dễ hiểu + **ảnh thuốc thật** + liều. 1 nút "Đã uống" |
| N2 | Nhắc lại (grace) | sau N1 + X phút chưa xác nhận (mặc định 30') | Nhẹ hơn N1, giọng mềm |
| N3 | Hỏi bằng giọng | sau N2 + Y phút (tracking-full) HOẶC 20h hằng ngày (tracking-lite) | App hỏi to "Hôm nay bác uống đủ thuốc chưa ạ?" → trả lời miệng |
| N4 | **Kiêng ăn theo bữa** (M12) | 30' trước giờ ăn, CHỈ khi có thuốc active có tương tác món phổ biến | "Bác đang uống thuốc mỡ máu — bữa nay mình tránh bưởi nha" — tối đa 1/bữa, tự tắt khi hết đợt thuốc |
| N5 | Lịch khám | 1 ngày trước + sáng hôm đó | Kèm địa chỉ + nút mở Maps |
| N6 | **Kết thúc đợt thuốc** (M18) | ngày cuối của đợt | "Hôm nay là ngày cuối đợt kháng sinh. Bác uống nốt liều này là xong rồi! 🎉" |

### Phía con cái (P1 — web/app)
| # | Loại | Khi nào | Hình thức |
|---|---|---|---|
| C1 | **Digest tối** | 21h, 1 notification/ngày | Gộp: tình hình uống thuốc cả nhà + việc ngày mai + cảnh báo nhẹ |
| C2 | Bỏ lỡ liều (chỉ tracking-full) | sau khi bậc thang P2 hết (N1→N2→N3 đều im) | "Mẹ chưa xác nhận liều trưa — có thể mẹ uống rồi mà quên bấm. Gọi hỏi thăm nha?" + nút tick hộ |
| C3 | "Báo ổn" ❤️ | ngay khi ba mẹ bấm | Tức thời, vui, nhẹ — dopamine của app |
| C4 | Tương tác thuốc | ngay khi confirm đơn mới có xung đột | Mức độ + giải thích + "hỏi bác sĩ" |
| C5 | Sắp hết thuốc / hết hạn | ước còn ≤5 ngày (M18) hoặc hạn dùng ≤30 ngày | Kèm nút tìm nhà thuốc gần (M16) |
| C6 | Kết thúc đợt thuốc | ngày cuối | "Đợt thuốc dạ dày của ba xong hôm nay. Toa dặn tái khám sau 2 tuần — đặt lịch không?" |

## 3. Bậc thang escalation (tracking-full)
```
Giờ uống ──▶ N1 (báo thức + giọng) ──30'──▶ N2 (nhắc mềm) ──30'──▶ N3 (hỏi bằng giọng)
                                                                        │ vẫn im lặng
                                                            60' sau ──▶ C2 cho con (giọng điệu trấn an,
                                                                        gợi ý gọi điện, KHÔNG báo động)
```
- Mỗi liều tối đa **1 lần** leo hết thang. Không lặp vô hạn.
- Tracking-lite: chỉ có N1 + N3 (câu hỏi tối) — không bao giờ có C2.
- *Reasoning:* bậc cuối là "gợi ý gọi hỏi thăm" chứ không phải "MISSED DOSE ALERT" — giữ đúng triết lý an tâm ≠ giám sát; cuộc gọi của con mới là hành động chăm sóc thật, app chỉ mồi.

## 4. Kỹ thuật
- **Nguồn giờ:** schedules trong Firestore (đã sync Google Calendar/Tasks — Calendar là "sổ lịch" cho con xem chéo, notification trong app là kênh chính cho ba mẹ).
- **TTS:** sinh sẵn audio cho các câu template (đọc tên thuốc theo custom_name) — không gọi AI lúc bắn notification → **0 token cho toàn bộ hệ thống nhắc** (đúng luật #3). Chỉ N3 (nghe câu trả lời) dùng STT.
- **Copy notification:** viết sẵn bộ template theo vai xưng hô (bác/ông/bà/cô/chú + tên) — cấu hình lúc onboarding.
- Offline: lịch nhắc cache local trên app (backlog câu hỏi kỹ thuật cho Antigravity — đã ghi ở [19](19-Decision-Log.md)).

## 🔲 Thanh duyệt
1. 5 nguyên tắc + bậc thang escalation ok?
2. Digest tối cho con 21h — giờ nào hợp hơn?
3. N4 (kiêng ăn theo bữa) — có sợ phiền không, hay để mặc định bật?
