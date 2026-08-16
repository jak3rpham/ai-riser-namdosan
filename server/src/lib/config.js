/**
 * Cấu hình backend.
 *
 * ⚠️ Khoá KHÔNG nằm ở đây và KHÔNG nằm trong image. Cloud Run gắn secret từ
 * Secret Manager vào biến môi trường lúc chạy (`--set-secrets`). Trên máy dev,
 * lấy tạm từ .env của frontend.
 *
 * Thiếu khoá thì báo lỗi ngay lúc khởi động, không chạy tiếp bằng cấu hình
 * nửa vời — cùng nguyên tắc "thất bại thì báo thất bại" ở doc 35.
 */

export const config = {
  port: Number(process.env.PORT) || 8080,
  projectId:
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    'ai-riser-namdosan-fa737',

  geminiApiKey: process.env.GEMINI_API_KEY || '',

  /**
   * Mật khẩu dùng chung cho các tài khoản demo (tên đăng nhập cố định trong
   * `routes/demo.js`). Không đặt biến này thì chế độ dùng thử tắt hẳn — đó là
   * mặc định an toàn, không phải lỗi.
   */
  demoPassword: process.env.DEMO_PASSWORD || '',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',

  /** Model ghim cứng — phải khớp với GEMINI_MODEL phía frontend */
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',

  /**
   * Model đọc thành tiếng. Tách riêng vì TTS là họ model khác model chat, và
   * khoá có thể chưa được bật quyền dùng nó.
   *
   * Không có/không bật → `/ai/speak` trả TTS_MODEL_UNAVAILABLE và frontend
   * quay về giọng của trình duyệt. Đây là suy giảm có kiểm soát, không phải lỗi.
   */
  ttsModel: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts',

  /** Giọng đọc. Đổi bằng env, không phải sửa code rồi deploy lại. */
  ttsVoice: process.env.GEMINI_TTS_VOICE || 'Leda',

  /** Bật/tắt TTS phía server mà không cần deploy lại frontend */
  ttsEnabled: process.env.TTS_ENABLED !== 'false',


  /**
   * Hạn mức chống lạm dụng, tính theo từng người dùng.
   *
   * ⚠️ Đây là TRẦN CHỐNG LẠM DỤNG, không phải công cụ kiểm soát ngân sách.
   * Kiểm soát ngân sách là budget alert trên Cloud Billing (mục 5 doc 47).
   *
   * Nâng 60 → 150 vì một câu hỏi giờ tốn nhiều lượt hơn hẳn:
   *   1 lượt  /ai/classify-symptom  (hiểu câu nói)
   *   1 lượt  /ai/ask               (trả lời)
   *   1 lượt  /ai/speak             (đọc thành tiếng)
   * Giữ 60 thì bác hết lượt sau 20 câu — trong khi trước đây 60 câu.
   * Phần nào đệm được thì đã đệm: phân loại đệm theo câu chữ ở client,
   * TTS đệm theo nội dung ở server.
   */
  limits: {
    aiCallsPerUserPerDay: Number(process.env.AI_CALLS_PER_DAY) || 150,
    aiCallsPerUserPerMinute: Number(process.env.AI_CALLS_PER_MIN) || 12
  },

  /** Nguồn được phép gọi API. Cùng origin qua Hosting rewrite nên rất hẹp. */
  allowedOrigins: (process.env.ALLOWED_ORIGINS ||
    'https://ai-riser-namdosan-fa737.web.app,https://ai-riser-namdosan-fa737.firebaseapp.com,http://localhost:3000,https://localhost:3000'
  ).split(',').map(s => s.trim()).filter(Boolean),

  isProduction: process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE
};

export function assertConfig() {
  const problems = [];
  if (!config.geminiApiKey) {
    problems.push(
      'Thiếu GEMINI_API_KEY. Trên Cloud Run: --set-secrets=GEMINI_API_KEY=gemini-api-key:latest'
    );
  }
  if (problems.length) {
    console.error('[config] Không khởi động được:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
}
