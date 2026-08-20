import { signInWithCustomToken } from 'firebase/auth';
import { getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { apiPost, apiGet } from './apiClient';
import { seedDemoData } from './demoSeed';

/**
 * Đăng nhập bằng tài khoản dùng thử (tên đăng nhập + mật khẩu).
 *
 * ─────────────────────────────────────────────────────────────────
 * VÌ SAO KHÔNG DÙNG EMAIL
 *
 * Phát cho người chấm một tài khoản Gmail sẽ hỏng: họ đang đăng nhập vào
 * GOOGLE chứ không phải vào app này, và Google sẽ chặn thiết bị lạ rồi đòi mã
 * xác minh gửi về máy chủ tài khoản. Ở đây tài khoản là của riêng app: backend
 * kiểm tra tên và mật khẩu rồi cấp Firebase custom token.
 *
 * Luồng: /api/demo/login → custom token → signInWithCustomToken →
 * nạp dữ liệu hư cấu nếu nhà còn trống.
 *
 * Lối vào này KHÔNG nằm trong app chính. Nó ở đường riêng `/demo`, để người
 * dùng thật không bao giờ thấy nút "xem thử".
 */

const HOUSEHOLD_KEY = 'airiser_household';

export async function listDemoAccounts() {
  return apiGet('/demo/accounts');
}

export async function loginDemo(username, password) {
  const res = await apiPost('/demo/login', { username, password });
  if (!res.ok) return res;

  try {
    await signInWithCustomToken(auth, res.token);
  } catch (err) {
    return {
      ok: false,
      error_code: 'TOKEN_SIGNIN_FAILED',
      error_message: 'Đăng nhập được nhưng chưa mở được phiên làm việc. Bạn thử lại nhé.',
      detail: err.message
    };
  }

  const hid = res.household_id;

  // Lần đăng nhập đầu: backend mới chỉ dựng nhà rỗng. Nạp dữ liệu hư cấu vào.
  // Những lần sau nhà đã có người thì bỏ qua, để thao tác của người chấm ở
  // lần trước không bị ghi đè.
  try {
    const snap = await getDocs(collection(db, 'households', hid, 'subjects'));
    if (snap.empty) await seedDemoData(hid);
  } catch (err) {
    return {
      ok: false,
      error_code: 'SEED_FAILED',
      error_message: 'Chưa nạp được dữ liệu mẫu. Bạn thử lại nhé.',
      detail: err.message
    };
  }

  try { localStorage.setItem(HOUSEHOLD_KEY, hid); } catch { /* chế độ riêng tư */ }

  return { ok: true, household_id: hid, username: res.username };
}

export async function resetPassword(username, phone, newPassword) {
  const res = await apiPost('/demo/reset-password', {
    username,
    phone,
    new_password: newPassword
  });
  if (!res.ok) return res;

  try {
    await signInWithCustomToken(auth, res.token);
  } catch (err) {
    return {
      ok: false,
      error_code: 'TOKEN_SIGNIN_FAILED',
      error_message: 'Đặt lại mật khẩu thành công nhưng chưa mở được phiên. Bạn thử đăng nhập lại nhé.',
      detail: err.message
    };
  }

  const hid = res.household_id;
  try { localStorage.setItem(HOUSEHOLD_KEY, hid); } catch { /* chế độ riêng tư */ }

  return { ok: true, household_id: hid, username: res.username, message: res.message };
}
