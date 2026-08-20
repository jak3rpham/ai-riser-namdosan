import { createHash, timingSafeEqual, scryptSync, randomBytes } from 'node:crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminAuth, fail } from '../plugins/auth.js';
import { config } from '../lib/config.js';

/**
 * Đăng nhập tài khoản dạng tên đăng nhập (Username & Password)
 * Hỗ trợ cả tài khoản người dùng thật và tài khoản mẫu cho ban giám khảo.
 */

const db = getFirestore();

/** Tên đăng nhập demo định sẵn cho ban giám khảo */
const DEMO_USERNAMES = ['giamkhao1', 'giamkhao2', 'giamkhao3', 'giamkhao4', 'giamkhao5', 'dungthu'];

/** So sánh chuỗi theo thời gian hằng định, tránh dò mật khẩu qua thời gian phản hồi. */
function safeEquals(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export default async function demoRoutes(app) {
  /** Danh sách tài khoản demo gợi ý */
  app.get('/accounts', async () => ({
    ok: true,
    usernames: DEMO_USERNAMES,
    enabled: true
  }));

  app.post('/login', async (request, reply) => {
    const username = String(request.body?.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const password = String(request.body?.password || '');

    const badCredentials = () => fail(
      reply, 401, 'BAD_CREDENTIALS',
      'Tên đăng nhập hoặc mật khẩu chưa đúng. Bạn kiểm tra lại nhé.'
    );

    if (!username || !password) return badCredentials();

    // ── 1. Đăng nhập tài khoản demo / giám khảo ──
    if (DEMO_USERNAMES.includes(username)) {
      const demoPass = config.demoPassword || 'airiser2026';
      if (!safeEquals(password, demoPass)) return badCredentials();

      const uid = `demo_${username}`;

      const existing = await db.collection('households')
        .where('demo_owner', '==', uid)
        .limit(1)
        .get();

      let householdId;

      if (existing.empty) {
        const ref = db.collection('households').doc();
        const batch = db.batch();
        batch.set(ref, {
          name: `Nhà thử nghiệm — ${username}`,
          host_uid: uid,
          demo_owner: uid,
          is_demo: true,
          created_at: FieldValue.serverTimestamp()
        });
        batch.set(ref.collection('members').doc(uid), {
          role: 'host',
          display_name: 'Người dùng thử',
          anonymous: false,
          joined_at: FieldValue.serverTimestamp()
        });
        await batch.commit();
        householdId = ref.id;
      } else {
        householdId = existing.docs[0].id;
      }

      const token = await adminAuth.createCustomToken(uid, { demo: true, household_id: householdId });

      request.log.info({ username }, 'đăng nhập tài khoản demo');
      return { ok: true, token, household_id: householdId, username, display_name: 'Ban Giám Khảo' };
    }

    // ── 2. Đăng nhập tài khoản người dùng thật trong app_users ──
    const userDoc = await db.doc(`app_users/${username}`).get();
    if (!userDoc.exists) return badCredentials();

    const userData = userDoc.data();
    if (!userData.password_hash || !userData.salt) return badCredentials();

    try {
      const computedHash = scryptSync(password, userData.salt, 64).toString('hex');
      const isValid = timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(userData.password_hash, 'hex')
      );

      if (!isValid) return badCredentials();
    } catch {
      return badCredentials();
    }

    const uid = userData.uid || `user_${username}`;
    const token = await adminAuth.createCustomToken(uid, { household_id: userData.household_id });

    request.log.info({ username }, 'người dùng đăng nhập tài khoản thật');
    return {
      ok: true,
      token,
      household_id: userData.household_id,
      username: userData.username,
      display_name: userData.display_name || userData.username,
      phone: userData.phone || null
    };
  });

  /* ── Khôi phục & Đặt lại mật khẩu ── */
  app.post('/reset-password', async (request, reply) => {
    const username = String(request.body?.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const phone = String(request.body?.phone || '').trim().replace(/\D/g, '');
    const newPassword = String(request.body?.new_password || '').trim();

    if (!username || !phone || !newPassword) {
      return fail(reply, 400, 'BAD_INPUT', 'Vui lòng nhập đầy đủ tên đăng nhập, số điện thoại và mật khẩu mới.');
    }

    if (newPassword.length < 4) {
      return fail(reply, 400, 'SHORT_PASSWORD', 'Mật khẩu mới cần ít nhất 4 ký tự.');
    }

    const userDoc = await db.doc(`app_users/${username}`).get();
    if (!userDoc.exists) {
      return fail(reply, 404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản với tên đăng nhập này.');
    }

    const userData = userDoc.data();
    const storedPhone = String(userData.phone || '').trim().replace(/\D/g, '');

    if (!storedPhone || storedPhone !== phone) {
      return fail(reply, 403, 'PHONE_MISMATCH', 'Số điện thoại không khớp với số điện thoại đã đăng ký cho tài khoản này.');
    }

    const salt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(newPassword, salt, 64).toString('hex');

    await db.doc(`app_users/${username}`).update({
      password_hash: passwordHash,
      salt: salt,
      updated_at: FieldValue.serverTimestamp()
    });

    const uid = userData.uid || `user_${username}`;
    const token = await adminAuth.createCustomToken(uid, { household_id: userData.household_id });

    request.log.info({ username }, 'đã đặt lại mật khẩu thành công');
    return {
      ok: true,
      token,
      household_id: userData.household_id,
      username: userData.username,
      display_name: userData.display_name || userData.username,
      phone: userData.phone || null,
      message: 'Đặt lại mật khẩu thành công!'
    };
  });
}
