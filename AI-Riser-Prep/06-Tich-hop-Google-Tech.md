# 06 — Tích hợp Google Tech (ăn +10 điểm)

> **Google Tech Integration: tối đa +10 điểm** — chấm theo **độ sâu, hiệu quả, và cách tận dụng đúng** công nghệ Google. Bao gồm nhưng không giới hạn: **Gemini, Firebase, Maps, Workspace** (Gmail, Google Calendar, Google Sheets...).
>
> ⚠️ Điểm này thưởng cho tích hợp **có ý nghĩa**, giải quyết đúng nhu cầu — không phải "nhét cho có". Hãy chọn công nghệ mà app **thực sự cần**.

## Bảng chọn nhanh: cần gì → dùng gì
| App của bạn cần... | Dùng Google tech | Ghi chú |
|---|---|---|
| Hiểu / sinh ngôn ngữ, tóm tắt, phân loại, chatbot, phân tích ảnh/âm thanh | **Gemini API** | Lõi AI; đa phương thức (text, image, audio, video) |
| Lưu dữ liệu, đăng nhập, realtime, hosting | **Firebase** | Firestore, Auth, Realtime DB, Hosting, Storage |
| Bản đồ, địa điểm, chỉ đường, geocoding | **Google Maps Platform** | Maps, Places, Directions, Geocoding |
| Đọc/ghi email, lịch, bảng tính, tài liệu | **Google Workspace APIs** | Gmail, Calendar, Sheets, Docs, Drive |
| Deploy web công khai | **Google Cloud Run** | +10đ Deployment (web) |
| Publish app Android | **Google Play** | +10đ Deployment (mobile) |

---

## 1) Gemini (lõi AI — gần như bắt buộc nếu muốn "AI thật")
Dùng cho: chatbot, tóm tắt, trích xuất & chuẩn hoá dữ liệu, phân loại, sinh nội dung, phân tích ảnh/âm thanh/video (multi-modal), RAG hỏi–đáp tài liệu.
- Trong AI Studio: chọn integration Gemini khi build; nói rõ trong prompt ("use the Gemini API to...").
- **Ý tưởng tích hợp mạnh:**
  - Chatbot RAG trả lời từ tài liệu nội bộ (đề đối tác #1, #6).
  - Trích xuất thông tin từ ảnh/PDF danh thiếp, hoá đơn → JSON chuẩn (#2, #4, #11).
  - Tóm tắt & cảnh báo rủi ro từ báo cáo (#9).
  - Sinh Company Profile / báo cáo tự động (#4, #7).

## 2) Firebase (dữ liệu + auth + realtime)
Dùng cho: lưu dữ liệu người dùng (Firestore), đăng nhập (Auth), realtime (chat, dashboard live), hosting, lưu file (Storage).
- Giúp app có **người dùng thật + lưu trạng thái** → hỗ trợ tiêu chí **user engagement** (lợi thế Gold/Platinum).
- **Ý tưởng:** dashboard theo dõi tiến độ startup (#9), lưu hồ sơ kết nối (#2, #10), realtime business matching (#10).

## 3) Google Maps Platform
Dùng cho: hiển thị điểm đến, chỉ đường, tìm địa điểm gần, tính khoảng cách.
- **Ý tưởng:** so sánh khu công nghệ theo vị trí (#3), du lịch/di sản (theme Cultural Tourism), điểm đến xanh (#11), y tế nông thôn (theme Healthcare).

## 4) Google Workspace (Gmail / Calendar / Sheets / Docs / Drive)
Dùng cho: tự động hoá công việc văn phòng.
- **Ý tưởng:**
  - **Sheets** làm "database nhẹ" + nguồn/đích dữ liệu chuẩn hoá (#7 chuẩn hoá Excel; #2 hồ sơ).
  - **Calendar** tối ưu & đặt lịch Business Matching 1:1 (#10), lịch hẹn y tế/giáo dục.
  - **Gmail** gửi thông báo/nhắc tự động (#1, #5).
  - **Docs** xuất Company Profile / báo cáo ESG (#4, #11).

## 5) Deployment (Cloud Run / Google Play) — +10đ riêng
- **Web → Google Cloud Run** (bắt buộc để tính điểm). Có thể deploy **ngay trong AI Studio**.
- **Mobile → Google Play** (phí một lần 25 USD tạo dev account).
- Chi tiết: [04-Huong-dan-Build-Deploy.md](04-Huong-dan-Build-Deploy.md).

---

## 🏆 Combo ăn điểm gợi ý (dễ đạt gần trần bonus 23đ)
1. **Gemini** làm lõi AI (bắt buộc để "impact") →  góp phần điểm Google Tech.
2. **+ Firebase hoặc Workspace** để có dữ liệu/tự động hoá → tăng "độ sâu" tích hợp (đẩy gần +10).
3. **Deploy Cloud Run** (web) → +10.
4. **Nộp trong 200 bài đầu** → +3.
→ Tổng bonus tiềm năng: **~23 điểm** cộng trên nền Idea (tối đa 100).

> 💡 Trong prompt gửi AI Studio, nêu thẳng: *"Integrate the Gemini API for {X}, use Firebase to store {Y}, and use Google Calendar to {Z}."* để AI Studio dựng sẵn khung tích hợp.
