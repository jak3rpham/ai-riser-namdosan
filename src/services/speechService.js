/**
 * Đọc thành tiếng — hai tầng, tầng dưới không bao giờ được phép câm.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  Tầng 1  /ai/speak  → giọng Gemini, có cảm xúc, ngắt nghỉ đúng chỗ
 *  Tầng 2  speechSynthesis của trình duyệt → giọng máy, nhưng luôn có
 * ═══════════════════════════════════════════════════════════════════
 *
 * Vì sao phải có tầng 2, và vì sao nó không được bỏ đi cho gọn:
 *
 * Câu quan trọng nhất app từng đọc là câu bảo bác gọi 115. Nếu tầng 1 hỏng
 * — mất mạng, hết quota, model TTS chưa bật trên khoá — mà không có tầng 2,
 * thì đúng câu đó là câu bị câm. Người đang hoảng, mắt kém, không đọc chữ
 * trên màn hình.
 *
 * Nên: gọi tầng 1, hỏng thì rơi xuống tầng 2 ngay, không báo lỗi ra màn hình.
 * Người dùng không cần biết giọng nào đang đọc; họ cần nghe được câu đó.
 *
 * Sau lần đầu tầng 1 thất bại thì thôi không thử lại trong phiên này nữa —
 * mỗi lần thử là một lần chờ 20 giây trước khi phát ra tiếng.
 */

import { apiPost } from './apiClient';
import { registerBrief } from './honorifics';

let remoteDisabledForSession = false;
let currentAudio = null;

/** Dừng mọi thứ đang phát — cả hai tầng */
export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/** Tầng 2 — giọng trình duyệt. Luôn có mặt, không bao giờ ném lỗi. */
function speakLocal(text) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'vi-VN';
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
  return true;
}

/**
 * Đọc một câu.
 *
 * @returns {Promise<'remote'|'local'|'none'>} tầng nào đã đọc — để log/hiện nhãn
 */
export async function speakOut(text, memberProfile = {}) {
  const clean = String(text || '').replace(/[⚠️✓•·]/g, '').trim();
  if (!clean) return 'none';

  stopSpeaking();

  // Quá dài thì backend cũng từ chối (giới hạn 600). Khỏi tốn một vòng mạng.
  if (remoteDisabledForSession || clean.length > 600) {
    return speakLocal(clean) ? 'local' : 'none';
  }

  const res = await apiPost('/ai/speak', {
    text: clean,
    register: registerBrief(memberProfile)
  });

  if (!res.ok || !res.audio) {
    // TTS_MODEL_UNAVAILABLE nghĩa là khoá này không có model TTS — trạng thái
    // cố định, thử lại là phí. Các lỗi khác cũng vậy trong phạm vi một phiên.
    remoteDisabledForSession = true;
    console.info('[speech] dùng giọng trình duyệt:', res.error_code || 'NO_AUDIO');
    return speakLocal(clean) ? 'local' : 'none';
  }

  try {
    const audio = new Audio(`data:${res.mime || 'audio/wav'};base64,${res.audio}`);
    currentAudio = audio;
    await audio.play();
    return 'remote';
  } catch {
    // Trình duyệt chặn autoplay khi chưa có tương tác người dùng. Giọng máy
    // qua speechSynthesis thường không bị chặn — thử tiếp, đừng bỏ cuộc.
    return speakLocal(clean) ? 'local' : 'none';
  }
}
