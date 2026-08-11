# 05 — Prompting & Vibe-Coding (viết prompt chuẩn)

> Kết hợp ví dụ chính thức trong Handbook + kỹ thuật thực hành. Master guide: **goo.gle/itsvibecoding** (Google AI & Vibe Coding Handbook).

## Nguyên tắc vàng
Prompt càng **cấu trúc & chi tiết** → app càng tốt. Một prompt tốt nên có 5 phần:
1. **System Role** — vai trò AI đóng (ví dụ: "expert full-stack developer & UX/UI designer").
2. **Task** — nhiệm vụ cụ thể ("vibe-code a modern note-taking app, viết code hoàn chỉnh").
3. **Tech Stack** — công nghệ dùng (để chạy ngay: SPA, HTML5, Vanilla JS, TailwCSS qua CDN, thư viện icon, Markdown parser...).
4. **Core Features & Functionality** — liệt kê từng tính năng (CRUD, lưu localStorage, search, tags...).
5. **The "Vibe" (Design & UX)** — thẩm mỹ, layout, micro-interactions, dark/light mode, bo góc, đổ bóng.
6. **Output Constraints** — ràng buộc đầu ra (1 file `index.html`, CSS trong `<style>`, JS trong `<script>`, không để placeholder, code sạch & comment).

## Mẹo dùng Gemini để "nâng cấp" prompt
Vào https://gemini.google.com/app và gõ:
> *"Please prepare a prompt for me to send to Google AI Studio to vibe-code this app: {mô tả app của bạn}."*

---

## Ví dụ so sánh (từ Handbook chính thức)

**❌ Lazy prompt:**
```
Build me a note-taking app.
```

**✅ Refined prompt (rút gọn cấu trúc):**
```
System Role: You are an expert full-stack developer and UX/UI designer known for
creating beautiful, intuitive, and highly functional web applications.

Task: I want to "vibe-code" a modern note-taking application. Please write the
complete, fully functioning code for this app.

Tech Stack (để chạy ngay - Single-Page Application):
- HTML5
- Vanilla JavaScript (ES6+)
- Tailwind CSS (import via CDN)
- CDN icon library (FontAwesome / Phosphor Icons) nếu cần
- CDN Markdown parser (Marked.js) để hỗ trợ Markdown

Core Features & Functionality:
1. CRUD Operations: tạo, đọc, sửa, xoá note.
2. Data Persistence: tự lưu vào browser localStorage (giữ sau khi refresh).
3. Markdown Support: editor nhận Markdown, render đẹp khi xem.
4. Search & Filter: thanh search real-time lọc theo title/content.
5. Categorization: tag màu + pin note yêu thích lên đầu.

The "Vibe" (Design & UX):
- Aesthetic: clean, minimalist, modern (pha giữa Notion và Apple Notes).
- Layout: 2-pane (sidebar trái chứa search + list; editor lớn bên phải).
- Interactivity: micro-interactions mượt, hover states, transitions.
- Theming: Dark Mode mặc định + toggle Light Mode; bo góc kiểu macOS; đổ bóng mềm.

Output Constraints:
- Toàn bộ app trong 1 file index.html duy nhất.
- CSS trong <style>, JS trong <script> ở cuối file.
- KHÔNG để placeholder kiểu "// add logic here" — viết logic hoàn chỉnh.
- Code sạch, comment rõ, modular trong thẻ script.
```

---

## Kỹ thuật vibe-coding thực chiến (mở rộng)
- **Bắt đầu nhỏ, lặp nhanh:** build bản chạy được trước, rồi thêm tính năng từng vòng (Step 4). Đừng nhồi mọi thứ vào 1 prompt khổng lồ.
- **Sửa lỗi bằng cách dán nguyên error:** *"Please fix this error: '{error}'"*.
- **Yêu cầu cụ thể khi thêm feature:** nói rõ vị trí, hành vi, dữ liệu ("thêm footer chứa giờ mở cửa & số điện thoại").
- **Khoá tech stack** để app chạy ngay không cần cài đặt (SPA + CDN).
- **Mô tả "vibe" rõ** → UI đẹp, ăn điểm creativity: tông màu, cảm hứng (Notion/Apple), animation.
- **Yêu cầu code hoàn chỉnh** ("no placeholders, complete working logic").
- **Đưa dữ liệu mẫu** để demo trông thật (danh sách sản phẩm, user giả...).
- **Nhắc tích hợp Google tech ngay trong prompt** nếu muốn +10đ (ví dụ "use Gemini API to summarize", "store data in Firebase") — xem [06](06-Tich-hop-Google-Tech.md).
- **Nghĩ tới demo video:** thiết kế 1 "happy path" mượt để quay clip ≤2 phút thuyết phục.

## Prompt mẫu để bạn tái sử dụng (điền chỗ trống)
```
System Role: You are an expert full-stack developer and UX/UI designer.
Task: Vibe-code a {loại app} that solves {vấn đề} for {đối tượng người dùng ở VN}.
Write complete, working code.

Tech Stack: Single-Page App — HTML5 + Vanilla JS (ES6+) + Tailwind CSS (CDN).
{Nếu cần AI: use the Gemini API for {tính năng AI}. Nếu cần lưu dữ liệu: use Firebase.
Nếu cần bản đồ: use Google Maps.}

Core Features:
1. {tính năng 1}
2. {tính năng 2}
3. {tính năng 3}

The Vibe: {mô tả thẩm mỹ, layout, dark mode, animation}.
Include realistic sample data for demo.

Output Constraints: single index.html, CSS in <style>, JS in <script>,
no placeholders, clean commented code.
```
