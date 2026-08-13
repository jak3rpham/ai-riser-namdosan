/**
 * Đăng nhập Google + lấy access token để gọi API Google thật.
 *
 * ─────────────────────────────────────────────────────────────────
 * CÁCH HOẠT ĐỘNG
 * Một lần bấm "Kết nối Google" làm hai việc cùng lúc:
 *   1. Firebase Auth  → danh tính người dùng (để Firestore rules biết ai là ai)
 *   2. OAuth access token → chìa khoá gọi Calendar / Tasks REST API
 *
 * `signInWithPopup` với `provider.addScope(...)` trả về cả hai trong một
 * hộp thoại đồng ý duy nhất — người dùng chỉ phải bấm một lần.
 *
 * ─────────────────────────────────────────────────────────────────
 * ⚠️ HẠN CHẾ CẦN BIẾT
 * Firebase KHÔNG tự gia hạn access token của Google. Token sống khoảng 1 giờ.
 * Hết hạn → API trả 401 → app phải mời người dùng kết nối lại.
 * Đây là đánh đổi có chủ ý: đổi lấy việc chỉ có một luồng đồng ý, không phải
 * dựng thêm Google Identity Services. Với vòng demo và thử nghiệm gia đình
 * thì chấp nhận được; nếu sau này cần chạy nền dài hạn thì phải chuyển sang
 * backend giữ refresh token. Xem doc 36 mục 7.
 */

import { GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebaseConfig';

/** Quyền xin từ tài khoản Google của người dùng. Xin đúng thứ cần, không hơn. */
export const GOOGLE_SCOPES = {
  calendar: 'https://www.googleapis.com/auth/calendar.events',
  tasks: 'https://www.googleapis.com/auth/tasks'
};

const TOKEN_STORAGE_KEY = 'airiser_google_token';

/**
 * Lưu ở sessionStorage chứ không phải localStorage: token biến mất khi đóng
 * tab. Đây là app y tế, token nằm lại trên máy càng lâu càng nhiều rủi ro —
 * nhất là khi máy tính dùng chung trong nhà.
 */
function readStoredToken() {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.access_token || !parsed.expires_at) return null;
    if (Date.now() >= parsed.expires_at) return null; // đã hết hạn
    return parsed;
  } catch {
    return null;
  }
}

function storeToken(accessToken, grantedScopes = []) {
  const payload = {
    access_token: accessToken,
    // Google cấp token sống 3600s. Trừ hao 5 phút để không gọi API bằng
    // token sắp chết giữa chừng.
    expires_at: Date.now() + (3600 - 300) * 1000,
    scopes: grantedScopes
  };
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* chế độ riêng tư có thể chặn — vẫn dùng được trong phiên nhờ biến nhớ */
  }
  memoryToken = payload;
  return payload;
}

let memoryToken = null;

export function clearGoogleToken() {
  memoryToken = null;
  try { sessionStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* bỏ qua */ }
}

/** Token còn dùng được không? */
export function getGoogleToken() {
  if (memoryToken && Date.now() < memoryToken.expires_at) return memoryToken;
  memoryToken = readStoredToken();
  return memoryToken;
}

export function isGoogleConnected() {
  return !!getGoogleToken();
}

/** Đã được cấp quyền này chưa? */
export function hasScope(scope) {
  const token = getGoogleToken();
  if (!token) return false;
  // Google không phải lúc nào cũng trả danh sách scope; không có thì coi như
  // có (API sẽ tự báo 403 nếu thiếu, và ta xử lý lỗi đó tử tế).
  if (!token.scopes || token.scopes.length === 0) return true;
  return token.scopes.includes(scope);
}

/**
 * Kết nối tài khoản Google.
 * Trả về { ok, user, token, error } — KHÔNG ném lỗi ra ngoài, và KHÔNG bao
 * giờ trả về dữ liệu giả khi thất bại.
 */
export async function connectGoogle({ scopes = [GOOGLE_SCOPES.calendar, GOOGLE_SCOPES.tasks] } = {}) {
  try {
    const provider = googleProvider;
    scopes.forEach(s => provider.addScope(s));
    // Ép hiện màn chọn tài khoản: nhà có nhiều tài khoản Google, chọn nhầm
    // thì lịch uống thuốc chui vào sai nơi.
    provider.setCustomParameters({ prompt: 'consent select_account' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      return {
        ok: false,
        error_code: 'NO_ACCESS_TOKEN',
        error_message: 'Đăng nhập được nhưng Google không cấp quyền truy cập Lịch/Việc cần làm. Bạn thử kết nối lại và bấm Đồng ý ở phần quyền nhé.'
      };
    }

    const token = storeToken(credential.accessToken, scopes);

    return {
      ok: true,
      user: {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      },
      token
    };
  } catch (err) {
    return { ok: false, ...describeAuthError(err) };
  }
}

/** Đổi mã lỗi Firebase thành câu tiếng Việt nói rõ phải làm gì */
function describeAuthError(err) {
  const code = err?.code || 'unknown';

  const map = {
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập. Bấm kết nối lại khi sẵn sàng nhé.',
    'auth/popup-blocked': 'Trình duyệt chặn cửa sổ bật lên. Bạn cho phép pop-up với trang này rồi thử lại.',
    'auth/cancelled-popup-request': 'Có nhiều cửa sổ đăng nhập cùng lúc. Bạn thử lại một lần nữa nhé.',
    'auth/unauthorized-domain': 'Tên miền này chưa được thêm vào Firebase Authentication → Settings → Authorized domains. Xem doc 36 mục 3.',
    'auth/operation-not-allowed': 'Chưa bật phương thức đăng nhập Google trong Firebase Console → Authentication → Sign-in method.',
    'auth/invalid-api-key': 'Khoá Firebase không hợp lệ. Kiểm tra VITE_FIREBASE_API_KEY trong file .env.',
    'auth/network-request-failed': 'Không có mạng hoặc mạng chặn. Kiểm tra kết nối rồi thử lại.'
  };

  return {
    error_code: code,
    error_message: map[code] || `Không kết nối được Google (${code}). Xem Console để biết chi tiết.`
  };
}

/**
 * Gọi REST API của Google với access token hiện có.
 *
 * Đây là chỗ DUY NHẤT gọi ra API Google, để việc xử lý token hết hạn và lỗi
 * quyền nằm một chỗ.
 */
export async function googleApiFetch(url, options = {}) {
  const token = getGoogleToken();

  if (!token) {
    return {
      ok: false,
      error_code: 'NOT_CONNECTED',
      error_message: 'Chưa kết nối tài khoản Google. Bấm "Kết nối Google" ở đầu trang trước nhé.'
    };
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  } catch (err) {
    return {
      ok: false,
      error_code: 'NETWORK_ERROR',
      error_message: 'Không gọi được tới Google (mất mạng?). Thao tác chưa được lưu lên Google.',
      detail: err.message
    };
  }

  if (response.status === 401) {
    // Token hết hạn hoặc bị thu hồi — xoá để UI biết mà mời kết nối lại
    clearGoogleToken();
    return {
      ok: false,
      error_code: 'TOKEN_EXPIRED',
      error_message: 'Phiên kết nối Google đã hết hạn. Bạn kết nối lại giúp nhé.'
    };
  }

  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    const reason = body?.error?.message || '';
    return {
      ok: false,
      error_code: 'PERMISSION_DENIED',
      error_message: reason.includes('has not been used') || reason.includes('disabled')
        ? 'API này chưa được bật trong Google Cloud project. Xem doc 36 mục 2.'
        : 'Tài khoản chưa cấp đủ quyền cho thao tác này. Bạn kết nối lại và đồng ý tất cả các mục nhé.',
      detail: reason
    };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return {
      ok: false,
      error_code: `HTTP_${response.status}`,
      error_message: body?.error?.message || `Google trả về lỗi ${response.status}.`,
      detail: body
    };
  }

  // 204 No Content (vd khi xoá) không có body
  if (response.status === 204) return { ok: true, data: null };

  const data = await response.json().catch(() => null);
  return { ok: true, data };
}

/* ── Đăng nhập cho ba mẹ (P2): ẩn danh, không cần tài khoản Google ── */
export async function signInParentAnonymously() {
  try {
    const result = await signInAnonymously(auth);
    return { ok: true, user: { uid: result.user.uid, isAnonymous: true } };
  } catch (err) {
    return { ok: false, ...describeAuthError(err) };
  }
}

export async function disconnectGoogle() {
  clearGoogleToken();
  try {
    await signOut(auth);
    return { ok: true };
  } catch (err) {
    return { ok: false, ...describeAuthError(err) };
  }
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
