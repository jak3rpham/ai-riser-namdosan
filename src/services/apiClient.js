import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

/**
 * Cầu nối duy nhất tới backend.
 *
 * ⚠️ Sau khi có file này, khoá Gemini KHÔNG còn trong bundle trình duyệt nữa.
 * Trước đây `VITE_GEMINI_API_KEY` nằm thẳng trong file JS — mở F12 là đọc được
 * và gọi API bằng tiền của chủ project (doc 41 mục 2).
 *
 * Mọi lời gọi đều kèm Firebase ID token. Chưa đăng nhập thì tự đăng nhập ẩn
 * danh — đây là "Tầng 0" ở doc 37 mục 3: dùng thử được ngay, không cần tài
 * khoản, mà vẫn có danh tính để backend tính hạn mức.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/** Chờ Firebase xác định xong trạng thái đăng nhập ở lần tải trang đầu */
let readyPromise = null;

function ensureUser() {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise(resolve => {
    const stop = onAuthStateChanged(auth, async user => {
      stop();
      if (user) return resolve(user);
      try {
        const cred = await signInAnonymously(auth);
        resolve(cred.user);
      } catch (err) {
        console.error('[api] không đăng nhập ẩn danh được:', err?.code);
        resolve(null);
      }
    });
  });

  return readyPromise;
}

/**
 * Gọi backend. Luôn trả về `{ ok, ... }` — không bao giờ ném lỗi ra ngoài,
 * và không bao giờ trả dữ liệu bịa khi hỏng (doc 35 mục 5).
 */
export async function apiPost(path, body) {
  const user = await ensureUser();

  if (!user) {
    return {
      ok: false,
      error_code: 'NO_SESSION',
      error_message: 'Chưa tạo được phiên làm việc. Bạn tải lại trang giúp nhé.'
    };
  }

  let token;
  try {
    token = await user.getIdToken();
  } catch {
    return {
      ok: false,
      error_code: 'NO_TOKEN',
      error_message: 'Phiên làm việc hết hạn. Bạn tải lại trang giúp nhé.'
    };
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch {
    return {
      ok: false,
      error_code: 'NETWORK_ERROR',
      error_message: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.'
    };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      error_code: `HTTP_${res.status}`,
      error_message: 'Máy chủ trả về dữ liệu không đọc được.'
    };
  }

  return data;
}

/** Máy chủ có sống không — dùng cho màn chẩn đoán */
export async function apiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch {
    return { ok: false, error_code: 'UNREACHABLE' };
  }
}

export { ensureUser };
