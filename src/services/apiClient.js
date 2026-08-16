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

/**
 * Người dùng hiện tại. Chưa đăng nhập thì tự đăng nhập ẩn danh.
 *
 * ⚠️ LUÔN ưu tiên `auth.currentUser`, và KHÔNG ghim kết quả vào promise.
 *
 * Bản trước ghim: lần gọi đầu tạo `readyPromise` rồi trả lại đúng nó mãi mãi.
 * Chuyện đó phá hỏng đường của giám khảo, và phá theo kiểu tệ nhất:
 *
 *   1. Mở `/demo` → apiClient tự đăng nhập ẩn danh để gọi được `/demo/login`.
 *      `readyPromise` ghim tài khoản ẩn danh đó.
 *   2. Đăng nhập thành công → `signInWithCustomToken` đổi sang tài khoản demo.
 *      Lưu id nhà vào máy. Chuyển sang `/app` (không tải lại trang, nên biến
 *      trong module còn nguyên).
 *   3. `checkMembership` gọi `ensureUser()` → nhận lại tài khoản ẨN DANH cũ →
 *      đọc `members/{uidẨnDanh}` → không có → kết luận "không phải thành viên"
 *      → `forgetHousehold()` xoá id nhà → màn hình onboarding.
 *
 * Nghĩa là giám khảo đăng nhập bằng đúng tài khoản được phát, rồi thấy app
 * trống trơn hỏi "Tạo nhà mới hay có mã mời?" — như thể chưa ai làm gì cả.
 *
 * Đã kiểm trên bản live 16/08: `localStorage.airiser_household` bị xoá sạch
 * ngay sau khi đăng nhập.
 */
function ensureUser() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (readyPromise) return readyPromise;

  readyPromise = new Promise(resolve => {
    const stop = onAuthStateChanged(auth, async user => {
      stop();
      // Nhả promise ra ngay: lần sau hỏi lại từ đầu thay vì đọc kết quả cũ.
      readyPromise = null;
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
/**
 * GET không cần đăng nhập. Chỉ dùng cho dữ liệu công khai — hiện là danh sách
 * tên tài khoản dùng thử, để màn hình đăng nhập gợi ý sẵn. Không bao giờ gọi
 * chỗ này cho dữ liệu y tế.
 */
export async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    return await res.json();
  } catch {
    return { ok: false, error_code: 'NETWORK_ERROR', error_message: 'Chưa kết nối được máy chủ.' };
  }
}

/**
 * Chặn trên thời gian chờ, tính bằng mili giây.
 *
 * Vì sao cần: mọi lời gọi ở đây nằm GIỮA bác và câu trả lời. Không có hạn thì
 * mạng 3G chập chờn làm màn hình đứng im vô thời hạn ở "Cháu Bi đang suy
 * nghĩ..." — bác không biết máy hỏng hay mình phải chờ, nên bấm lại, nên hỏng
 * thật. Thà trả lời bằng lớp dự phòng còn hơn treo.
 *
 * `/ai/speak` để ngắn nhất: nó chỉ là giọng đọc, và có sẵn giọng trình duyệt
 * thay thế ngay lập tức. Chờ nó 20 giây là im lặng 20 giây.
 */
const TIMEOUTS = {
  '/ai/speak': 3500,
  '/ai/classify-symptom': 4000,
  default: 25000
};

function timeoutFor(path) {
  return TIMEOUTS[path] ?? TIMEOUTS.default;
}

/**
 * Tín hiệu huỷ theo thời gian.
 *
 * ⚠️ Không dùng thẳng `AbortSignal.timeout` được. Safari trên iOS chỉ có nó từ
 * bản 16; máy cũ hơn thì `AbortSignal.timeout` là undefined, gọi vào là ném
 * TypeError NGAY TRONG khối try bọc fetch — và khối đó quy mọi lỗi về
 * "Không kết nối được máy chủ". Nghĩa là trên iPhone đời cũ, mọi lời gọi
 * backend đều báo mất mạng dù mạng vẫn tốt, và không có gì trên màn hình chỉ ra
 * nguyên nhân thật. Đây đúng nhóm máy mà ba mẹ hay dùng (máy con cái để lại).
 *
 * `clear` phải được gọi sau khi fetch xong, không thì bộ đếm còn treo.
 */
function abortAfter(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return { signal: AbortSignal.timeout(ms), clear: () => {} };
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new DOMException('TimeoutError', 'TimeoutError')), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

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

  const limit = abortAfter(timeoutFor(path));

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: limit.signal
    });
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return {
      ok: false,
      error_code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      error_message: timedOut
        ? 'Máy chủ trả lời chậm quá. Bạn thử lại nhé.'
        : 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.'
    };
  } finally {
    limit.clear();
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
