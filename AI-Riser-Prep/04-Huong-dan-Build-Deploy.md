# 04 — Hướng dẫn Build & Deploy (Google AI Studio)

> Tổng hợp từ Participant Handbook + kiến thức thực hành. Nguồn gốc từng bước: goo.gle/airiser-handbook.

## Vibe-coding là gì?
Thay vì gõ code (`if x > 10`), bạn **mô tả app bằng ngôn ngữ tự nhiên** ("prompt") → AI build cho bạn. Trong AI Riser bạn sẽ viết nhiều prompt để vibe-code app giải quyết vấn đề thực tế.

## Build được gì?
| Web App 🌐 | Android App 📱 |
|---|---|
| Mặc định; chạy trên trình duyệt (Chrome). | Tùy chọn; tải về điện thoại Android. |
| Deploy: **Google Cloud Run** | Publish: **Google Play** |

---

## Quy trình 5 bước

### Step 1 — Describe Your Application (Mô tả app)
- Prompt càng chi tiết → app càng tốt.
- Dùng **Gemini** (https://gemini.google.com/app) tinh chỉnh prompt bằng câu:
  > *"Please prepare a prompt for me to send to Google AI Studio to vibe-code this app: {mô tả app}."*
- Chi tiết cách viết prompt chuẩn: xem [05-Prompting-VibeCoding.md](05-Prompting-VibeCoding.md).
- **Pro tips:**
  - 💡 Chỉnh refined prompt theo ý bạn trước khi dùng.
  - 🧑‍💻 Non-technical? Có thể giữ nguyên hoặc xoá phần chi tiết kỹ thuật.
  - 🏆 Tích hợp Google tech (Gemini/Firebase/Maps/Workspace) → **+10 điểm** (xem [06](06-Tich-hop-Google-Tech.md)).

### Step 2 — Navigate to Google AI Studio
1. Vào **https://ai.dev** (hoặc https://aistudio.google.com/apps).
2. Đăng nhập Google account.
3. 💡 **QUAN TRỌNG — Starter Tier miễn phí:** Dùng Google account **CHƯA từng publish app nào** trên AI Studio → publish **MIỄN PHÍ, không cần thẻ tín dụng / billing**. (Nếu bị đòi thẻ = bạn không ở Starter Tier → thử **incognito** hoặc account khác chưa publish.)
4. Panel trái: chọn **"Build"** → trang **"+ New app"**.

### Step 3 — Build in AI Studio
1. Dán refined prompt vào ô input.
2. **Chọn integration** bạn định dùng (báo cho AI Studio biết integration cần thiết).
3. Bấm **"Build"**.
4. Integration cần permission → chọn **"Let's do it"**.
5. [Optional] Chọn **design** thích nhất, hoặc bỏ qua để AI tự quyết / dùng design riêng.

### Step 4 — Iterations of Improvement (Lặp cải tiến)
1. Test app vừa build.
2. Yêu cầu AI sửa/thêm. Ví dụ:
   - Sửa lỗi: *"Please fix this error '{dán error message}'."*
   - Thêm tính năng: *"Please add a footer to include operation hours and contact number."*
3. Lặp đến khi hài lòng.

### Step 5 — Publishing (Optional Bonus, +10 điểm) 🏆

**Web App:**
1. Góc trên phải → **"Publish"** → **"Get started"**.
2. Cập nhật description & app URL.
3. Xong! Ai có link đều dùng được (không thấy code/prompt). App mẫu: `https://to-do-list-notes.ai.studio`
4. **Nộp link này** → +10 điểm. (Web bắt buộc host trên **Google Cloud Run** để tính điểm Deploy.)

**Mobile App (Android):**
1. Góc trên phải → **"Publish"** → **"Get started"**.
2. Tạo **Play Console developer account** ("Create account"). ⚠️ Phí **một lần 25 USD**.
3. Chờ **vài ngày làm việc** để account được review.
4. Review xong → **"Publish app for testing"**.
5. App test publish xong → ai có link tải được từ Google Play → **+10 điểm**.
6. 📝 App vẫn **chưa verified** (chỉ cho tester). Cần thêm bước để verify chính thức — làm sau nếu muốn scale.

---

## 🔗 Codelab thực hành (nên làm trước khi thi)
- **Vibe Code with Gemini in AI Studio:** https://codelabs.developers.google.com/vibe-code-with-gemini-in-aistudio
- **Deploy from AI Studio to Cloud Run:** https://codelabs.developers.google.com/deploy-from-aistudio-to-run
- **Starter Tier giải thích:** https://cloud.google.com/blog/topics/developers-practitioners/the-starter-tier-for-google-ai-studio-explained

## ✅ 2 link submission dễ nhầm
| Link | Bắt buộc? | Ai xem được gì |
|---|---|---|
| **AI Studio project link** (Share → Public → Copy Link) | ✅ BẮT BUỘC | Giám khảo xem **code + thông tin** dự án |
| **Deployed app link** (Cloud Run / Google Play) | ⭕ Optional (+10đ) | User chỉ **dùng app**, không thấy code |
