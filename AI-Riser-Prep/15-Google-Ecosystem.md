# 15 — Google Ecosystem: Build 100% trong hệ sinh thái (không cần auth phức tạp)

> Research 08/2026 từ docs chính thức (ai.google.dev) + blog Google. Mục tiêu: xác nhận **những gì AI Studio tích hợp được NATIVE** — không cần đàm phán đối tác, không OAuth thủ công, không phụ thuộc nền tảng ngoài → dễ thương mại hóa về sau.

## ✅ Kết luận nhanh (TL;DR)
**Thesis của bạn đúng:** AI Studio Build mode hiện auto-wire gần như toàn bộ Google ecosystem. Builder **không cần** tạo Google Cloud project, không cấu hình OAuth client, không quản lý credentials. End-user chỉ cần **1 nút "Sign in with Google"** và cấp quyền granular — app chỉ đọc được **dữ liệu của chính user đó**. Đây là lợi thế cực lớn về **feasibility** và về **đường thương mại hóa** (không phải "liên hệ hợp tác" với bên thứ ba nào).

---

## 1) AI & Model capabilities (native trong Build mode)
| Capability | Dùng để làm gì |
|---|---|
| **Gemini API** | Lõi AI: text, reasoning, đa phương thức (ảnh/audio/video/tài liệu). API key tự cấu hình **server-side, không bao giờ lộ ra client** — kể cả khi share app. |
| **Grounding with Google Search** | Trả lời với dữ liệu web tươi + trích nguồn (citations). Hết "ảo giác" về thông tin thời sự. |
| **Grounding with Google Maps** | Truy cập dữ liệu **250 triệu+ địa điểm** real-time. Hỏi có ngữ cảnh địa lý → trả lời chính xác theo vị trí. Hỗ trợ các model Gemini mới. |
| **Image generation (Nano Banana)** | Sinh/chỉnh ảnh trong app. |
| **Live API** | Tương tác **real-time bằng giọng nói** (voice agent). |
| **Video & audio understanding** | Hiểu nội dung video/audio người dùng đưa vào. |
| **Document processing** | Đọc hiểu PDF/tài liệu. |

## 2) Google Workspace — 12 API tích hợp sẵn 🔥
> Đây là "mỏ vàng" đúng ý bạn: app đọc/ghi **dữ liệu thật của user** (email, lịch, bảng tính...) mà không cần backend riêng hay hợp tác gì.

**Danh sách 12 app:** Gmail · Sheets · Calendar · Drive · Docs · Chat · Forms · Meet · Keep · Slides · Tasks · Contacts

**Cách hoạt động (từ docs chính thức):**
- Mở **Integrations panel** (sidebar phải của Build mode) → bật Workspace app cần dùng.
- AI Studio tự động: (1) wire API cần thiết, (2) **sinh code server-side gọi API**, (3) thêm luồng **"Sign in with Google"** bảo mật để end-user tự cấp quyền dữ liệu **của chính họ**.
- Builder **không cần** OAuth client, credentials, hay Google Cloud project.
- Quyền granular theo nhu cầu app; *"Your app only accesses the data of the person using it."*

### ⚠️ Thực tế về consent (đừng kỳ vọng zero-consent)
- **Lần đầu sign in**, user thấy 1 màn hình cấp quyền liệt kê scope app cần → bấm "Cho phép" **1 lần duy nhất**. Đây là chính sách privacy cứng của Google, không lách được. Sau đó access tự động mãi (refresh token), không hỏi lại.
- **Web ↔ app cùng một sản phẩm:** sync qua **Firestore (backend của mình)** → cùng Google account là dữ liệu tự chảy, **zero consent thêm** — vì không đọc app Google nào khác.
- **Scope chia hạng — ảnh hưởng thương mại hóa:**
  - `Gmail` = **restricted** → publish công khai phải qua OAuth verification của Google, có thể kèm security assessment (CASA) tốn phí/thời gian.
  - `Calendar / Tasks / Drive / Sheets` = sensitive nhưng **nhẹ hơn nhiều**.
  - `Firestore / Firebase Auth` = của mình, **không cần verify gì**.
- **Hệ quả thiết kế:** dữ liệu lõi để ở Firestore; chỉ xin scope Workspace thật cần (ưu tiên Calendar/Tasks); tránh Gmail scope nếu không phải tính năng sống còn.

## 3) Backend & dữ liệu (Firebase — auto-provision)
| Thành phần | Chi tiết |
|---|---|
| **Firestore** | NoSQL cloud DB, tự provision — lưu dữ liệu bền vững cho app. |
| **Firebase Auth** | "Sign in with Google" flow dựng sẵn — agent tự setup + tự viết code. |
| **Node.js server runtime** | App full-stack (React frontend + Node backend). Chạy logic server-side. |
| **npm packages** | Yêu cầu là agent tự cài (ví dụ axios). |
| **Secrets panel** | Lưu key bên thứ ba (Stripe, SendGrid, Twilio...) an toàn qua env vars — *nếu sau này thật sự cần external*. |

## 4) Deploy & phân phối
| Kênh | Ghi chú |
|---|---|
| **Cloud Run** | 1-click từ AI Studio UI. (+10đ Deployment cho web) |
| **Google Play** | Build Android native trong AI Studio → publish. (+10đ cho mobile; phí $25 một lần) |
| **GitHub export** | Đẩy code ra repo — giữ quyền sở hữu code, làm CI/CD sau này. |
| **ZIP download** | Tự host nếu muốn. |

## 5) Ý nghĩa chiến lược cho bài thi

### Vì sao "all-in ecosystem" thắng cả 3 tiêu chí
- **Feasibility 💪:** mọi mảnh ghép (AI, DB, auth, data người dùng, deploy) đều dựng sẵn — tháng 8 đủ thời gian làm sản phẩm *hoàn chỉnh* thay vì vật lộn tích hợp.
- **Impact 💪:** app đụng vào **dữ liệu thật hằng ngày** của user (Gmail/Calendar/Sheets) → giá trị tức thì, dễ có user thật + engagement (điều kiện lên Gold/Platinum).
- **Google Tech +10đ:** tích hợp *sâu và đúng nhu cầu* — đúng nghĩa đen tiêu chí chấm. Giám khảo nhiều người là GDE Cloud/AI/**Workspace**/Firebase ([13-Ban-giam-khao.md](13-Ban-giam-khao.md)) → họ đánh giá được độ sâu này.
- **Thương mại hóa 💪:** không phụ thuộc API bên thứ ba → không cần hợp đồng đối tác; user onboard bằng 1 nút Google; code export được qua GitHub.

### Pattern kiến trúc "chuẩn bài" đề xuất
```
[User] ──Sign in with Google──▶ [App: React + Node (AI Studio)]
                                   │
        ┌──────────────┬───────────┼─────────────┬──────────────┐
        ▼              ▼           ▼             ▼              ▼
   Gemini API     Workspace    Firestore     Maps/Search    (Live API/
 (multimodal,    (Gmail/Sheets/ (dữ liệu     (grounding      Image gen
  grounding)     Calendar...)    app)        real-world)     nếu cần)
        │
        ▼
   Deploy: Cloud Run (web) / Google Play (Android)
```

### Combo tích hợp "ăn điểm sâu" (chọn 2–3, đừng tham)
1. **Gemini + Workspace** (Gmail/Sheets/Calendar): app làm việc trên dữ liệu thật của user — pattern mạnh nhất.
2. **Gemini + Maps grounding**: mọi ý tưởng có yếu tố địa điểm (du lịch, y tế địa phương, nông nghiệp).
3. **Gemini + Firestore + Auth**: app nhiều user, lưu trạng thái, có leaderboard/cộng đồng → chứng minh engagement.
4. **+ Search grounding**: khi cần thông tin tươi (giá cả, chính sách, tin lừa đảo mới).

## ⚠️ Lưu ý thực tế
- **Starter Tier**: dùng account chưa từng publish app AI Studio → deploy free không cần thẻ (xem [04](04-Huong-dan-Build-Deploy.md)). API call tính vào usage limits; model trả phí có thể phát sinh chi phí — với demo thi thì free tier thường đủ.
- Khi chấm, giám khảo mở **AI Studio project link** xem code → tích hợp phải **thật** (code gọi API thật), không phải mock.
- Đừng bật quá nhiều integration "cho có" — tiêu chí chấm là *depth, effectiveness, proper utilization*.

## Nguồn
- [Build apps in Google AI Studio — docs](https://ai.google.dev/gemini-api/docs/aistudio-build-mode)
- [Develop Full-Stack Apps in AI Studio — docs](https://ai.google.dev/gemini-api/docs/aistudio-fullstack)
- [From prompt to production: AI Studio + Firebase](https://firebase.blog/posts/2026/03/announcing-ai-studio-integration/)
- [Build native Android apps in AI Studio — Android Dev Blog](https://android-developers.googleblog.com/2026/05/build-android-apps-google-ai-studio.html)
- [Grounding with Google Maps in Gemini API](https://ai.google.dev/gemini-api/docs/maps-grounding) · [Blog](https://blog.google/innovation-and-ai/technology/developers-tools/grounding-google-maps-gemini-api/)
- [Grounding with Google Search](https://developers.googleblog.com/en/gemini-api-and-ai-studio-now-offer-grounding-with-google-search/)
- [Starter Tier explained](https://cloud.google.com/blog/topics/developers-practitioners/the-starter-tier-for-google-ai-studio-explained)
